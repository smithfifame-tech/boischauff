import 'server-only';
import crypto from 'node:crypto';
import { db, num } from './db';
import { newReceiptNumber, newTxPublicId, getFullOrder, type FullOrder } from './orders';
import { HttpError, safeEqual, sha256 } from './security';
import { siteUrl } from './settings';
import { toCents } from './pricing';

/* ==========================================================================
   Passerelle SasPay (https://docs.saspay.me) — MTN MoMo, Moov Money, Celtiis Cash…
   --------------------------------------------------------------------------
   - Session de paiement hébergée : POST /checkout-sessions/ → checkout_url.
   - L'environnement dépend de l'HÔTE : api.saspay.me = réel, sandbox-api.saspay.me = test.
     Une clé sk_live_ n'est acceptée qu'en "live", une clé sk_test_ qu'en "sandbox".
   - Webhook : en-têtes X-Webhook-Signature (HMAC-SHA256 hex de `${timestamp}.${corps}`)
     et X-Webhook-Timestamp. La transaction est TOUJOURS relue par l'API authentifiée.
   - Montants transmis en chaînes décimales (« 10000.00 »).
   Les clés restent côté serveur (variables d'environnement), jamais dans le navigateur.
   ========================================================================== */

export type ProviderName = 'saspay' | 'demo' | 'none';

/** Devises acceptées par SasPay (le site doit être configuré dans l'une d'elles). */
export const SASPAY_CURRENCIES = ['XOF', 'XAF', 'GHS', 'NGN', 'KES', 'UGX', 'TZS', 'RWF', 'ZMW', 'MWK', 'MZN', 'GNF', 'SLE', 'CDF', 'USD', 'INR'];

export function saspayConfig() {
  const env = (process.env.SASPAY_ENVIRONMENT === 'live' ? 'live' : 'sandbox') as 'live' | 'sandbox';
  return {
    env,
    baseUrl: (process.env.SASPAY_API_BASE_URL || (env === 'live' ? 'https://api.saspay.me/api/v1' : 'https://sandbox-api.saspay.me/api/v1')).replace(/\/$/, ''),
    secretKey: process.env.SASPAY_SECRET_KEY || '',
    webhookSecret: process.env.SASPAY_WEBHOOK_SECRET || '',
  };
}

/** Clé de test uniquement vers le bac à sable, clé réelle uniquement vers l'hôte réel. */
export function saspayKeyMatchesEnv() {
  const c = saspayConfig();
  if (!c.secretKey) return false;
  if (process.env.SASPAY_API_BASE_URL) return true; // hôte personnalisé (tests)
  return c.env === 'live' ? c.secretKey.startsWith('sk_live_') : c.secretKey.startsWith('sk_test_');
}

export function saspayConfigured() {
  const c = saspayConfig();
  return Boolean(c.secretKey && c.webhookSecret && saspayKeyMatchesEnv());
}

/** Mode démonstration : actif uniquement si SasPay n'est pas configuré et si PAYMENT_DEMO_MODE ≠ "off". */
export function demoAllowed() {
  return !saspayConfigured() && (process.env.PAYMENT_DEMO_MODE || 'auto') !== 'off';
}

export function activeProvider(): ProviderName {
  if (saspayConfigured()) return 'saspay';
  if (demoAllowed()) return 'demo';
  return 'none';
}

type ProviderStatus = 'succeeded' | 'failed' | 'pending';

class SaspayApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

async function saspayCall<T>(method: 'GET' | 'POST', path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  const c = saspayConfig();
  if (!saspayKeyMatchesEnv()) throw new Error('Clé SasPay absente ou incohérente avec SASPAY_ENVIRONMENT.');
  const headers: Record<string, string> = { Authorization: `Bearer ${c.secretKey}`, 'Content-Type': 'application/json', Accept: 'application/json' };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const res = await fetch(`${c.baseUrl}${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  // Enveloppe documentée { success, data } — certains points d'accès renvoient l'objet à plat
  if (!res.ok || json.success === false) {
    const err = (json.error && typeof json.error === 'object' ? json.error : json) as Record<string, unknown>;
    const msg = typeof err.message === 'string' ? err.message : JSON.stringify(err).slice(0, 200);
    throw new SaspayApiError(res.status, `SasPay ${res.status}: ${msg}`.slice(0, 300));
  }
  return (json.success === true && json.data && typeof json.data === 'object' ? json.data : json) as T;
}

/** Montant en chaîne décimale : « 10000.00 ». */
export function toDecimalString(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

const DIAL_CODES: Record<string, string> = { '229': 'BJ', '228': 'TG', '227': 'NE', '226': 'BF', '234': 'NG', '225': 'CI', '221': 'SN', '223': 'ML', '237': 'CM' };
export function countryFromPhone(phone: string): string {
  const m = /^\+?(\d{3})/.exec(phone.replace(/[\s().-]/g, ''));
  return (m && phone.trim().startsWith('+') && DIAL_CODES[m[1]]) || 'BJ';
}
/** Numéros béninois : format à 10 chiffres « 01 » + 8 chiffres depuis le 30/11/2024. */
export function normalizePhone(phone: string): string {
  const p = phone.replace(/[\s().-]/g, '');
  const m = /^\+229(\d+)$/.exec(p);
  if (m && m[1].length === 8) return `+22901${m[1]}`;
  return p;
}

/** Référence BoisChauff+ insérée dans la description de la session (relue via la transaction). */
const REF_RE = /BC:(TX[A-Z0-9]{6,40})/;
export function extractTxRef(text: unknown): string | undefined {
  return typeof text === 'string' ? REF_RE.exec(text)?.[1] : undefined;
}

async function saspayCreate(order: FullOrder, txPublicId: string) {
  if (!SASPAY_CURRENCIES.includes(order.currency.toUpperCase())) {
    throw new HttpError(422, `La devise ${order.currency} n'est pas acceptée par SasPay. Configurez le site en FCFA (XOF) dans l'administration.`);
  }
  const base = siteUrl();
  const ref = ` · Réf. BC:${txPublicId}`;
  const description = `Commande ${order.order_number} — bois de chauffage`;
  const session = await saspayCall<{ id: string; checkout_url: string }>('POST', '/checkout-sessions/', {
    amount: toDecimalString(order.total_amount ?? 0),
    currency: order.currency.toUpperCase(),
    country: countryFromPhone(order.customer_phone),
    description: `${description.slice(0, 250 - ref.length)}${ref}`,
    customer_email: order.customer_email,
    customer_name: `${order.customer_first_name} ${order.customer_last_name}`.trim().slice(0, 120),
    customer_phone: normalizePhone(order.customer_phone),
    return_url: `${base}/paiement/retour?order=${encodeURIComponent(order.order_number)}&t=${encodeURIComponent(order.access_token)}`,
    metadata: { tx: txPublicId, order_number: order.order_number, source: 'boischauff' },
    expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  }, `boischauff-${txPublicId}`);
  if (!session?.id || !session.checkout_url) throw new Error('Réponse SasPay incomplète (checkout_url).');
  if (!/^https:\/\//i.test(session.checkout_url)) throw new Error('URL de paiement SasPay non sécurisée.');
  return { providerTxId: String(session.id), checkoutUrl: session.checkout_url };
}

/** État d'une session de paiement (SasPay revérifie auprès de l'opérateur). */
export async function saspaySessionStatus(sessionId: string): Promise<{ status: ProviderStatus; raw: unknown }> {
  const s = await saspayCall<{ status?: string; transaction_status?: string | null }>('GET', `/checkout-sessions/${encodeURIComponent(sessionId)}/status/`);
  if (s.status === 'PAID' && s.transaction_status === 'SUCCESS') return { status: 'succeeded', raw: s };
  if (s.status === 'EXPIRED' || s.status === 'CANCELLED') return { status: 'failed', raw: s };
  return { status: 'pending', raw: s };
}

/** Relecture authentifiée d'une transaction notifiée par webhook. */
export async function saspayVerifyTransaction(trxId: string) {
  const t = await saspayCall<{ id: string; status?: string; currency?: string; description?: string; requested_amount?: string; type?: string; transaction_type?: string; metadata?: { tx?: string } | null }>(
    'GET', `/payments/${encodeURIComponent(trxId)}/verify/`);
  const amount = typeof t.requested_amount === 'string' && /^\d+(\.\d+)?$/.test(t.requested_amount) ? Number(t.requested_amount) : null;
  return {
    status: (t.status === 'SUCCESS' ? 'succeeded' : t.status === 'FAILED' ? 'failed' : 'pending') as ProviderStatus,
    currency: t.currency,
    amountCents: amount === null ? null : toCents(amount),
    txRef: extractTxRef(t.description) ?? (typeof t.metadata?.tx === 'string' ? t.metadata.tx : undefined),
    raw: t,
  };
}

/** Signature SasPay : HMAC-SHA256 (hex) de `${X-Webhook-Timestamp}.${corps brut}`, tolérance 5 min. */
export function verifyWebhookSignature(rawBody: string, signature: string | null, timestamp: string | null): boolean {
  const secret = saspayConfig().webhookSecret;
  if (!secret || !signature || !timestamp || !/^\d{1,16}$/.test(timestamp.trim())) return false;
  const ts = timestamp.trim();
  const expected = crypto.createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex');
  const candidates = signature.split(',').map((v) => v.trim().replace(/^(sha256|v1|s)=/i, '').toLowerCase()).filter(Boolean);
  if (!candidates.some((c) => safeEqual(c, expected))) return false;
  const seconds = ts.length >= 13 ? Math.floor(Number(ts) / 1000) : Number(ts);
  return Math.abs(Date.now() / 1000 - seconds) <= 300;
}

/* ==========================================================================
   Cycle de vie d'une transaction
   ========================================================================== */

export interface InitResult { redirectUrl: string; provider: ProviderName; reused: boolean }

export async function initPayment(orderNumber: string, accessToken: string): Promise<InitResult> {
  const provider = activeProvider();
  if (provider === 'none') throw new HttpError(503, 'Le paiement en ligne n\'est pas encore configuré. Contactez-nous pour finaliser votre commande.');

  const order = await getFullOrder({ number: orderNumber });
  if (!order || !safeEqual(order.access_token, accessToken)) throw new HttpError(404, 'Commande introuvable.');
  if (order.payment_status === 'paid') throw new HttpError(409, 'Cette commande est déjà payée.');
  if (order.status === 'awaiting_quote' || order.total_amount === null) {
    throw new HttpError(409, 'Les frais de livraison doivent d\'abord être validés par notre équipe. Vous recevrez un e-mail dès que le paiement sera possible.');
  }
  if (order.status !== 'pending_payment') throw new HttpError(409, 'Cette commande ne peut pas être payée.');

  // Protection contre les paiements multiples : réutilise une session récente encore ouverte.
  const [recent] = await db()<{ public_id: string; checkout_url: string; amount: string }[]>`
    select public_id, checkout_url, amount from payment_transactions
    where order_id = ${order.id} and provider = ${provider} and status in ('created','pending')
      and checkout_url is not null and created_at > now() - interval '30 minutes'
    order by created_at desc limit 1`;
  if (recent && toCents(num(recent.amount)) === toCents(order.total_amount)) {
    return { redirectUrl: recent.checkout_url, provider, reused: true };
  }

  const publicId = newTxPublicId();
  await db()`
    insert into payment_transactions (public_id, order_id, provider, status, amount, currency)
    values (${publicId}, ${order.id}, ${provider}, 'created', ${order.total_amount}, ${order.currency})`;

  try {
    let providerTxId: string;
    let checkoutUrl: string;
    if (provider === 'saspay') {
      const r = await saspayCreate(order, publicId);
      providerTxId = r.providerTxId;
      checkoutUrl = r.checkoutUrl;
    } else {
      providerTxId = `demo_${publicId}`;
      checkoutUrl = `/paiement/demo/${publicId}?t=${encodeURIComponent(order.access_token)}`;
    }
    await db()`update payment_transactions set provider_tx_id = ${providerTxId}, checkout_url = ${checkoutUrl},
               status = 'pending', updated_at = now() where public_id = ${publicId}`;
    await db()`update orders set payment_status = 'pending', updated_at = now() where id = ${order.id} and payment_status <> 'paid'`;
    return { redirectUrl: checkoutUrl, provider, reused: false };
  } catch (e) {
    const reason = (e as Error).message.slice(0, 300);
    console.error('[payment] création impossible', reason);
    if (e instanceof HttpError) { await db()`update payment_transactions set status = 'failed', failure_reason = ${reason}, updated_at = now() where public_id = ${publicId}`; throw e; }
    await db()`update payment_transactions set status = 'failed', failure_reason = ${reason}, updated_at = now() where public_id = ${publicId}`;
    throw new HttpError(502, 'La passerelle de paiement est momentanément indisponible. Merci de réessayer dans quelques instants.');
  }
}

export interface SettleResult { orderId: number; outcome: 'paid' | 'already_paid' | 'failed' | 'pending' | 'mismatch' }

/**
 * Enregistre le résultat VÉRIFIÉ d'une transaction. Idempotent et transactionnel :
 * une commande ne peut être marquée payée qu'une seule fois, et uniquement si le
 * montant et la devise confirmés par la passerelle correspondent exactement.
 */
export async function settleTransaction(publicId: string, verified: {
  status: ProviderStatus; amountCents?: number | null; currency?: string | null; method?: string; isDemo: boolean; raw?: unknown; reason?: string;
}): Promise<SettleResult> {
  const result = await db().begin(async (sql) => {
    const [tx] = await sql<Record<string, unknown>[]>`select * from payment_transactions where public_id = ${publicId} for update`;
    if (!tx) throw new HttpError(404, 'Transaction inconnue.');
    const orderId = Number(tx.order_id);
    const [order] = await sql<Record<string, unknown>[]>`select * from orders where id = ${orderId} for update`;
    const raw = verified.raw === undefined ? null : sql.json(verified.raw as never);

    if (tx.status === 'succeeded') return { orderId, outcome: 'already_paid' as const };

    if (verified.status === 'pending') {
      await sql`update payment_transactions set status = 'pending', raw_last_event = coalesce(${raw}, raw_last_event), updated_at = now() where id = ${tx.id as number}`;
      return { orderId, outcome: 'pending' as const };
    }

    if (verified.status === 'failed') {
      await sql`update payment_transactions set status = 'failed', failure_reason = ${verified.reason || 'Paiement refusé'},
                raw_last_event = coalesce(${raw}, raw_last_event), updated_at = now() where id = ${tx.id as number}`;
      if (order.payment_status !== 'paid') {
        await sql`update orders set payment_status = 'failed', updated_at = now() where id = ${orderId}`;
      }
      return { orderId, outcome: 'failed' as const };
    }

    // Succès confirmé par la passerelle
    if (order.payment_status === 'paid') {
      await sql`update payment_transactions set status = 'cancelled', failure_reason = 'Doublon : commande déjà payée — à rembourser',
                raw_last_event = coalesce(${raw}, raw_last_event), updated_at = now() where id = ${tx.id as number}`;
      await sql`insert into delivery_tracking (order_id, status, note, is_public, created_by)
                values (${orderId}, 'duplicate_payment', ${`Paiement en double détecté (${publicId}) — remboursement à traiter.`}, false, 'system')`;
      return { orderId, outcome: 'already_paid' as const };
    }
    const expected = toCents(num(order.total_amount));
    const amountOk = verified.amountCents === undefined || verified.amountCents === null || verified.amountCents === expected;
    const currencyOk = !verified.currency || verified.currency.toUpperCase() === String(order.currency).toUpperCase();
    if (!amountOk || !currencyOk || expected !== toCents(num(tx.amount))) {
      await sql`update payment_transactions set status = 'failed', failure_reason = 'Montant ou devise non conforme',
                raw_last_event = coalesce(${raw}, raw_last_event), updated_at = now() where id = ${tx.id as number}`;
      await sql`insert into delivery_tracking (order_id, status, note, is_public, created_by)
                values (${orderId}, 'payment_mismatch', ${`Montant/devise reçus non conformes pour ${publicId}. Vérification manuelle requise.`}, false, 'system')`;
      return { orderId, outcome: 'mismatch' as const };
    }

    await sql`update payment_transactions set status = 'succeeded', raw_last_event = coalesce(${raw}, raw_last_event), updated_at = now() where id = ${tx.id as number}`;
    await sql`
      insert into payments (order_id, provider, status, amount, currency, transaction_ref, method, is_demo, paid_at)
      values (${orderId}, ${tx.provider as string}, 'paid', ${order.total_amount as string}, ${order.currency as string},
              ${(tx.provider_tx_id as string) || publicId}, ${verified.method || ''}, ${verified.isDemo}, now())
      on conflict (order_id) do update set provider = excluded.provider, status = 'paid', amount = excluded.amount,
        currency = excluded.currency, transaction_ref = excluded.transaction_ref, method = excluded.method,
        is_demo = excluded.is_demo, paid_at = now(), updated_at = now()`;
    await sql`update orders set status = 'paid', payment_status = 'paid', paid_at = now(), updated_at = now(),
              is_demo = is_demo or ${verified.isDemo} where id = ${orderId}`;
    await sql`insert into delivery_tracking (order_id, status, note) values (${orderId}, 'paid',
              ${verified.isDemo ? 'Paiement de démonstration validé (aucun encaissement réel).' : 'Paiement confirmé par la passerelle.'})`;
    await sql`insert into receipts (receipt_number, order_id, amount, currency, is_demo)
              values (${newReceiptNumber()}, ${orderId}, ${order.total_amount as string}, ${order.currency as string}, ${verified.isDemo})
              on conflict (order_id) do nothing`;
    // Décrément du stock suivi
    await sql`
      update products p set stock_kg = greatest(0, p.stock_kg - s.kg), updated_at = now()
      from (select product_id, sum(quantity_kg) as kg from order_items where order_id = ${orderId} group by product_id) s
      where p.id = s.product_id and p.stock_kg is not null`;
    return { orderId, outcome: 'paid' as const };
  });

  if (result.outcome === 'paid') {
    // Envoi des e-mails après validation (hors transaction). Les erreurs sont journalisées.
    const { sendPaymentConfirmedEmails } = await import('./notifications');
    await sendPaymentConfirmedEmails(result.orderId).catch((e) => console.error('[email] envoi post-paiement', (e as Error).message));
  }
  return result;
}

/** Interroge la passerelle pour les dernières transactions ouvertes d'une commande (page de retour). */
export async function refreshOrderPayment(orderId: number): Promise<SettleResult | null> {
  const txs = await db()<{ public_id: string; provider_tx_id: string | null }[]>`
    select public_id, provider_tx_id from payment_transactions
    where order_id = ${orderId} and status in ('created','pending') and provider = 'saspay' and provider_tx_id is not null
    order by created_at desc limit 3`;
  let last: SettleResult | null = null;
  for (const t of txs) {
    try {
      const s = await saspaySessionStatus(t.provider_tx_id as string);
      // Le montant de la session est fixé à sa création (montant exact de la commande)
      last = await settleTransaction(t.public_id, { status: s.status, amountCents: null, currency: null, method: 'SasPay', isDemo: false, raw: s.raw,
        reason: s.status === 'failed' ? 'Session de paiement expirée ou annulée' : undefined });
      if (last.outcome === 'paid' || last.outcome === 'already_paid') break;
    } catch (e) {
      console.error('[payment] vérification impossible', (e as Error).message);
    }
  }
  return last;
}

export async function recordWebhookEvent(provider: string, eventId: string, payload: unknown): Promise<boolean> {
  const id = eventId || sha256(JSON.stringify(payload));
  const rows = await db()`insert into webhook_events (provider, event_id, payload) values (${provider}, ${id}, ${db().json(payload as never)})
                          on conflict (provider, event_id) do nothing returning id`;
  return rows.length > 0;
}
