import 'server-only';
import crypto from 'node:crypto';
import { db, num } from './db';
import { newReceiptNumber, newTxPublicId, getFullOrder, type FullOrder } from './orders';
import { HttpError, safeEqual, sha256 } from './security';
import { siteUrl } from './settings';
import { toCents } from './pricing';

/* ==========================================================================
   Passerelle SaaSPay
   --------------------------------------------------------------------------
   Toutes les valeurs sensibles sont lues côté serveur uniquement (variables
   d'environnement). Les chemins d'API sont configurables afin de s'aligner
   exactement sur la documentation officielle fournie avec le compte marchand.
   ========================================================================== */

export type ProviderName = 'saaspay' | 'demo' | 'none';

export function saaspayConfig() {
  return {
    baseUrl: (process.env.SAASPAY_API_BASE_URL || '').replace(/\/$/, ''),
    secretKey: process.env.SAASPAY_SECRET_KEY || '',
    webhookSecret: process.env.SAASPAY_WEBHOOK_SECRET || '',
    createPath: process.env.SAASPAY_CREATE_PATH || '/v1/payments',
    statusPath: process.env.SAASPAY_STATUS_PATH || '/v1/payments/{id}',
    signatureHeader: (process.env.SAASPAY_SIGNATURE_HEADER || 'x-saaspay-signature').toLowerCase(),
    merchantId: process.env.SAASPAY_MERCHANT_ID || '',
  };
}

export function saaspayConfigured() {
  const c = saaspayConfig();
  return Boolean(c.baseUrl && c.secretKey && c.webhookSecret);
}

/** Mode démonstration : actif uniquement si SaaSPay n'est pas configuré et si PAYMENT_DEMO_MODE ≠ "off". */
export function demoAllowed() {
  return !saaspayConfigured() && (process.env.PAYMENT_DEMO_MODE || 'auto') !== 'off';
}

export function activeProvider(): ProviderName {
  if (saaspayConfigured()) return 'saaspay';
  if (demoAllowed()) return 'demo';
  return 'none';
}

type ProviderStatus = 'succeeded' | 'failed' | 'pending';

function mapStatus(raw: unknown): ProviderStatus {
  const s = String(raw ?? '').toLowerCase();
  if (['paid', 'succeeded', 'success', 'successful', 'completed', 'complete', 'approved', 'captured', 'transferred'].includes(s)) return 'succeeded';
  if (['failed', 'failure', 'declined', 'refused', 'rejected', 'canceled', 'cancelled', 'expired', 'error'].includes(s)) return 'failed';
  return 'pending';
}

function pick(obj: unknown, paths: string[]): unknown {
  for (const p of paths) {
    let cur: unknown = obj;
    for (const k of p.split('.')) {
      if (cur && typeof cur === 'object' && k in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[k];
      else { cur = undefined; break; }
    }
    if (cur !== undefined && cur !== null && cur !== '') return cur;
  }
  return undefined;
}

async function saaspayRequest(method: 'GET' | 'POST', path: string, body?: unknown) {
  const c = saaspayConfig();
  const res = await fetch(`${c.baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${c.secretKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(c.merchantId ? { 'X-Merchant-Id': c.merchantId } : {}),
      ...(body && typeof body === 'object' && 'reference' in body ? { 'Idempotency-Key': String((body as { reference: string }).reference) } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 500) }; }
  if (!res.ok) {
    const msg = String(pick(json, ['message', 'error.message', 'error', 'detail']) ?? `HTTP ${res.status}`);
    throw new Error(`SaaSPay ${res.status}: ${msg}`.slice(0, 300));
  }
  return json;
}

async function saaspayCreate(order: FullOrder, txPublicId: string) {
  const base = siteUrl();
  const payload = {
    amount: order.total_amount,
    amount_minor: toCents(order.total_amount ?? 0),
    currency: order.currency,
    reference: txPublicId,
    order_id: order.order_number,
    description: `Commande ${order.order_number} — bois de chauffage`,
    customer: {
      email: order.customer_email,
      first_name: order.customer_first_name,
      last_name: order.customer_last_name,
      phone: order.customer_phone,
    },
    return_url: `${base}/paiement/retour?order=${encodeURIComponent(order.order_number)}&t=${encodeURIComponent(order.access_token)}`,
    cancel_url: `${base}/commande/paiement?order=${encodeURIComponent(order.order_number)}&t=${encodeURIComponent(order.access_token)}&cancelled=1`,
    webhook_url: `${base}/api/webhooks/saaspay`,
    callback_url: `${base}/api/webhooks/saaspay`,
    metadata: { order_number: order.order_number, reference: txPublicId },
  };
  const res = await saaspayRequest('POST', saaspayConfig().createPath, payload);
  const providerId = pick(res, ['id', 'data.id', 'transaction_id', 'data.transaction_id', 'payment_id', 'data.payment_id', 'token', 'data.token']);
  const checkoutUrl = pick(res, ['checkout_url', 'data.checkout_url', 'payment_url', 'data.payment_url', 'url', 'data.url', 'redirect_url', 'data.redirect_url', 'links.checkout']);
  if (!providerId || !checkoutUrl) throw new Error('Réponse SaaSPay inattendue : identifiant ou URL de paiement manquant.');
  const url = String(checkoutUrl);
  if (!/^https:\/\//i.test(url)) throw new Error('URL de paiement SaaSPay non sécurisée.');
  return { providerTxId: String(providerId), checkoutUrl: url, raw: res };
}

export async function saaspayFetchStatus(providerTxId: string) {
  const path = saaspayConfig().statusPath.replace('{id}', encodeURIComponent(providerTxId));
  const res = await saaspayRequest('GET', path);
  return {
    status: mapStatus(pick(res, ['status', 'data.status', 'payment_status', 'data.payment_status', 'state'])),
    amount: pick(res, ['amount', 'data.amount']) as number | string | undefined,
    amountMinor: pick(res, ['amount_minor', 'data.amount_minor']) as number | undefined,
    currency: pick(res, ['currency', 'data.currency']) as string | undefined,
    method: String(pick(res, ['payment_method', 'data.payment_method', 'method', 'data.method', 'channel', 'data.channel']) ?? ''),
    reference: pick(res, ['reference', 'data.reference', 'metadata.reference', 'data.metadata.reference']) as string | undefined,
    raw: res,
  };
}

/** Vérifie la signature HMAC-SHA256 d'un webhook (formats "hex", "sha256=hex" ou "t=…,v1=…"). */
export function verifyWebhookSignature(rawBody: string, header: string | null): boolean {
  const secret = saaspayConfig().webhookSecret;
  if (!secret || !header) return false;
  const h = header.trim();
  if (h.includes('v1=')) {
    const parts = Object.fromEntries(h.split(',').map((p) => p.trim().split('=') as [string, string]));
    const t = Number(parts.t);
    if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
    const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
    return safeEqual(expected, String(parts.v1 || ''));
  }
  const sig = h.startsWith('sha256=') ? h.slice(7) : h;
  const hex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const b64 = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  return safeEqual(hex, sig) || safeEqual(b64, sig);
}

export function extractWebhook(body: unknown) {
  return {
    eventId: String(pick(body, ['id', 'event_id', 'event.id']) ?? ''),
    reference: pick(body, ['data.reference', 'reference', 'data.metadata.reference', 'metadata.reference', 'data.object.reference']) as string | undefined,
    providerTxId: pick(body, ['data.id', 'data.transaction_id', 'transaction_id', 'payment_id', 'data.object.id']) as string | undefined,
  };
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
    if (provider === 'saaspay') {
      const r = await saaspayCreate(order, publicId);
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

/** Interroge la passerelle pour la dernière transaction ouverte d'une commande (page de retour). */
export async function refreshOrderPayment(orderId: number): Promise<SettleResult | null> {
  const txs = await db()<{ public_id: string; provider: string; provider_tx_id: string | null }[]>`
    select public_id, provider, provider_tx_id from payment_transactions
    where order_id = ${orderId} and status in ('created','pending') and provider = 'saaspay' and provider_tx_id is not null
    order by created_at desc limit 3`;
  let last: SettleResult | null = null;
  for (const t of txs) {
    try {
      const s = await saaspayFetchStatus(t.provider_tx_id as string);
      const amountCents = s.amountMinor !== undefined ? Number(s.amountMinor) : s.amount !== undefined ? toCents(Number(s.amount)) : null;
      last = await settleTransaction(t.public_id, { status: s.status, amountCents, currency: s.currency, method: s.method, isDemo: false, raw: s.raw });
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
