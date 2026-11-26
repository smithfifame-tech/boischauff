import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractWebhook, recordWebhookEvent, saaspayConfig, saaspayConfigured, saaspayFetchStatus, settleTransaction, verifyWebhookSignature } from '@/lib/payments';
import { toCents } from '@/lib/pricing';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Webhook SaaSPay : signature HMAC vérifiée, puis l'état est TOUJOURS re-vérifié
 * auprès de l'API SaaSPay avant toute mise à jour (on ne fait jamais confiance au seul contenu reçu).
 */
export async function POST(req: Request) {
  if (!saaspayConfigured()) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  const raw = await req.text();
  if (raw.length > 200_000) return NextResponse.json({ ok: false }, { status: 413 });
  if (!verifyWebhookSignature(raw, req.headers.get(saaspayConfig().signatureHeader))) {
    console.warn('[webhook] signature invalide');
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 });
  }
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const evt = extractWebhook(body);
  await recordWebhookEvent('saaspay', evt.eventId, body);

  const [tx] = evt.reference
    ? await db()<{ public_id: string; provider_tx_id: string | null }[]>`select public_id, provider_tx_id from payment_transactions where public_id = ${evt.reference}`
    : evt.providerTxId
      ? await db()<{ public_id: string; provider_tx_id: string | null }[]>`select public_id, provider_tx_id from payment_transactions where provider = 'saaspay' and provider_tx_id = ${evt.providerTxId}`
      : [];
  if (!tx) return NextResponse.json({ ok: true, ignored: 'unknown_transaction' });

  try {
    const s = await saaspayFetchStatus(tx.provider_tx_id || evt.providerTxId || '');
    const amountCents = s.amountMinor !== undefined ? Number(s.amountMinor) : s.amount !== undefined ? toCents(Number(s.amount)) : null;
    const r = await settleTransaction(tx.public_id, { status: s.status, amountCents, currency: s.currency, method: s.method, isDemo: false, raw: s.raw });
    await db()`update webhook_events set processed_at = now() where provider = 'saaspay' and event_id = ${evt.eventId}`;
    return NextResponse.json({ ok: true, outcome: r.outcome });
  } catch (e) {
    console.error('[webhook] traitement impossible', (e as Error).message);
    // 500 : la passerelle pourra renvoyer l'événement
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
