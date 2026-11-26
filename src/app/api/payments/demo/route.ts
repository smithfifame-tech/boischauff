import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, HttpError, readJson, safeEqual } from '@/lib/security';
import { activeProvider, settleTransaction } from '@/lib/payments';
import { toCents } from '@/lib/pricing';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const schema = z.object({
  txId: z.string().min(6).max(60),
  token: z.string().min(10).max(100),
  outcome: z.enum(['success', 'failed', 'pending']),
});

/**
 * Simulation de paiement — disponible UNIQUEMENT quand aucune passerelle (Stripe / SasPay) n'est configurée
 * et que PAYMENT_DEMO_MODE n'est pas "off". Les commandes concernées sont marquées "démo".
 */
export const POST = apiRoute(async (req) => {
  if (activeProvider() !== 'demo') throw new HttpError(403, 'Le mode démonstration est désactivé.');
  const { txId, token, outcome } = schema.parse(await readJson(req));
  const [tx] = await db()<{ public_id: string; amount: string; currency: string; provider: string; access_token: string; order_number: string }[]>`
    select t.public_id, t.amount, t.currency, t.provider, o.access_token, o.order_number
    from payment_transactions t join orders o on o.id = t.order_id where t.public_id = ${txId}`;
  if (!tx || tx.provider !== 'demo' || !safeEqual(tx.access_token, token)) throw new HttpError(404, 'Transaction introuvable.');
  const r = await settleTransaction(txId, {
    status: outcome === 'success' ? 'succeeded' : outcome === 'failed' ? 'failed' : 'pending',
    amountCents: toCents(Number(tx.amount)),
    currency: tx.currency,
    method: 'Démonstration',
    isDemo: true,
    reason: outcome === 'failed' ? 'Paiement refusé (simulation)' : undefined,
    raw: { simulated: true, outcome },
  });
  return NextResponse.json({ ok: true, outcome: r.outcome, orderNumber: tx.order_number });
});
