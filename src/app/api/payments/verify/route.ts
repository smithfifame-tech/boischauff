import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRoute, HttpError, readJson, safeEqual } from '@/lib/security';
import { getFullOrder } from '@/lib/orders';
import { activeProvider, refreshOrderPayment } from '@/lib/payments';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const schema = z.object({ orderNumber: z.string().min(5).max(40), token: z.string().min(10).max(100) });

/** Vérifie côté serveur, auprès de la passerelle, l'état réel du paiement (page de retour). */
export const POST = apiRoute(async (req) => {
  const { orderNumber, token } = schema.parse(await readJson(req));
  let order = await getFullOrder({ number: orderNumber });
  if (!order || !safeEqual(order.access_token, token)) throw new HttpError(404, 'Commande introuvable.');
  if (order.payment_status !== 'paid' && ['stripe', 'saspay'].includes(activeProvider())) {
    await refreshOrderPayment(order.id);
    order = await getFullOrder({ id: order.id });
  }
  const lastTx = order!.transactions[0];
  return NextResponse.json({
    ok: true,
    paymentStatus: order!.payment_status,
    status: order!.status,
    lastTransaction: lastTx ? { status: lastTx.status, reason: lastTx.failure_reason } : null,
  });
});
