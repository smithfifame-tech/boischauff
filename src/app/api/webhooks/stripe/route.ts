import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recordWebhookEvent, settleTransaction, stripeConfigured, stripeSessionStatus, verifyStripeSignature } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const HANDLED = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'];

/**
 * Webhook Stripe : https://votre-domaine/api/webhooks/stripe
 * Signature Stripe-Signature obligatoire, puis relecture de la session par l'API Stripe
 * (statut, montant, devise) avant toute mise à jour de la commande.
 */
export async function POST(req: Request) {
  if (!stripeConfigured()) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  const raw = await req.text();
  if (raw.length > 512 * 1024) return NextResponse.json({ ok: false }, { status: 413 });
  if (!verifyStripeSignature(raw, req.headers.get('stripe-signature'))) {
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 400 });
  }
  let event: { id?: string; type?: string; data?: { object?: { id?: string; object?: string } } };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const type = String(event.type || '');
  const sessionId = event.data?.object?.object === 'checkout.session' ? event.data.object.id : undefined;
  const fresh = await recordWebhookEvent('stripe', String(event.id || ''), event).catch(() => true);
  if (!HANDLED.includes(type) || !sessionId) return NextResponse.json({ ok: true, ignored: type });
  if (!fresh) return NextResponse.json({ ok: true, duplicate: true });

  try {
    const s = await stripeSessionStatus(sessionId);
    const [tx] = await db()<{ public_id: string }[]>`
      select public_id from payment_transactions where provider = 'stripe' and provider_tx_id = ${sessionId}`;
    if (!tx || (s.txRef && s.txRef !== tx.public_id)) return NextResponse.json({ ok: true, ignored: 'unknown_session' });
    let status = s.status;
    if (type === 'checkout.session.async_payment_failed' && status !== 'succeeded') status = 'failed';
    const r = await settleTransaction(tx.public_id, {
      status, amountCents: s.amountCents, currency: s.currency, method: 'Carte bancaire (Stripe)', isDemo: false, raw: s.raw,
      reason: status === 'failed' ? (type === 'checkout.session.expired' ? 'Session de paiement expirée' : 'Paiement refusé') : undefined,
    });
    await db()`update webhook_events set processed_at = now() where provider = 'stripe' and event_id = ${String(event.id || '')}`;
    return NextResponse.json({ ok: true, outcome: r.outcome });
  } catch (e) {
    console.error('[stripe-webhook] traitement impossible', (e as Error).message);
    return NextResponse.json({ ok: false }, { status: 500 }); // Stripe relivrera l'événement
  }
}
