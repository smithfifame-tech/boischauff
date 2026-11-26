import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRoute, clientIp, HttpError, readJson } from '@/lib/security';
import { assertNotRateLimited, recordAttempt } from '@/lib/auth';
import { getFullOrder, matchesContact, ORDER_STATUSES, PAYMENT_STATUSES, trackingStepIndex } from '@/lib/orders';

export const dynamic = 'force-dynamic';

const schema = z.object({ orderNumber: z.string().trim().min(5).max(40), contact: z.string().trim().min(5).max(160) });

/** Suivi public : aucune donnée personnelle n'est révélée sans vérification e-mail/téléphone. */
export const POST = apiRoute(async (req) => {
  const { orderNumber, contact } = schema.parse(await readJson(req));
  const ip = clientIp(req);
  const id = orderNumber.toUpperCase();
  await assertNotRateLimited('track', id, ip);
  const order = await getFullOrder({ number: id });
  if (!order || !matchesContact(order, contact)) {
    await recordAttempt('track', id, ip, false);
    throw new HttpError(404, 'Aucune commande ne correspond à ces informations.');
  }
  await recordAttempt('track', id, ip, true);
  return NextResponse.json({
    ok: true,
    order: {
      orderNumber: order.order_number,
      status: order.status,
      statusLabel: ORDER_STATUSES[order.status],
      paymentStatus: order.payment_status,
      paymentLabel: PAYMENT_STATUSES[order.payment_status],
      step: trackingStepIndex(order.status, order.payment_status),
      cancelled: order.status === 'cancelled',
      createdAt: order.created_at,
      city: order.address?.city ?? '',
      zone: order.delivery_zone_name,
      desiredDate: order.desired_delivery_date,
      items: order.items.map((i) => ({ name: i.product_name, quantityKg: i.quantity_kg })),
      total: order.total_amount,
      currency: order.currency,
      history: order.tracking.filter((t) => t.is_public).map((t) => ({ status: t.status, note: t.note, at: t.created_at })),
    },
  });
});
