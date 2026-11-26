import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recordWebhookEvent, saspayConfigured, saspayVerifyTransaction, settleTransaction, verifyWebhookSignature } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Webhook SasPay : https://votre-domaine/api/webhooks/saspay
 * La signature est vérifiée ; dans TOUS les cas la transaction est relue par l'API authentifiée
 * (clé secrète) avant toute mise à jour : un faux message ne peut rien valider.
 */
export async function POST(req: Request) {
  if (!saspayConfigured()) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  const raw = await req.text();
  if (raw.length > 256 * 1024) return NextResponse.json({ ok: false }, { status: 413 });
  const signed = verifyWebhookSignature(raw, req.headers.get('x-webhook-signature'), req.headers.get('x-webhook-timestamp'));
  if (!signed) console.warn('[saspay-webhook] signature non concordante : vérification par l\'API uniquement');

  let event: { event?: string; data?: { id?: string; status?: string; type?: string } };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const name = typeof event.event === 'string' ? event.event : 'unknown';
  const trxId = typeof event.data?.id === 'string' && /^[0-9a-zA-Z-]{8,64}$/.test(event.data.id) ? event.data.id : undefined;
  const eventId = `${name}:${trxId ?? 'none'}:${String(event.data?.status ?? '').slice(0, 20)}`;
  await recordWebhookEvent('saspay', eventId, event).catch(() => {});

  // Seul un paiement réussi fait avancer la commande (un échec sur la page SasPay peut être retenté)
  if (name !== 'transaction.success' || !trxId) return NextResponse.json({ ok: true, ignored: name });
  if (event.data?.type && event.data.type !== 'PAIEMENT') return NextResponse.json({ ok: true, ignored: 'type' });

  try {
    const trx = await saspayVerifyTransaction(trxId);
    if (trx.status !== 'succeeded') return NextResponse.json({ ok: true, ignored: 'not_success' });
    if (!trx.txRef) return NextResponse.json({ ok: true, ignored: 'not_boischauff' });
    const [tx] = await db()<{ public_id: string }[]>`select public_id from payment_transactions where public_id = ${trx.txRef} and provider = 'saspay'`;
    if (!tx) return NextResponse.json({ ok: true, ignored: 'unknown_transaction' });
    const r = await settleTransaction(tx.public_id, { status: 'succeeded', amountCents: trx.amountCents, currency: trx.currency ?? null, method: 'SasPay (Mobile Money)', isDemo: false, raw: trx.raw });
    await db()`update webhook_events set processed_at = now() where provider = 'saspay' and event_id = ${eventId}`;
    return NextResponse.json({ ok: true, outcome: r.outcome });
  } catch (e) {
    console.error('[saspay-webhook] traitement impossible', (e as Error).message);
    return NextResponse.json({ ok: false }, { status: 500 }); // SasPay relivrera l'événement
  }
}
