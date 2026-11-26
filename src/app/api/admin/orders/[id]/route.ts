import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, HttpError, readJson } from '@/lib/security';
import { requireAdmin } from '@/lib/auth';
import { setDeliveryFee, setOrderStatus, ORDER_STATUSES, type OrderStatus } from '@/lib/orders';
import { resendOrderEmails, sendQuoteReadyEmail, sendStatusUpdateEmail } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('status'), status: z.enum(Object.keys(ORDER_STATUSES) as [OrderStatus, ...OrderStatus[]]), note: z.string().max(1000).optional().default(''), notify: z.boolean().optional().default(true) }),
  z.object({ action: z.literal('delivery_fee'), fee: z.number().min(0).max(1_000_000), notify: z.boolean().optional().default(true) }),
  z.object({ action: z.literal('note'), note: z.string().max(5000) }),
  z.object({ action: z.literal('tracking'), note: z.string().trim().min(2).max(1000) }),
  z.object({ action: z.literal('resend_emails') }),
]);

export const PATCH = apiRoute<{ params: Promise<{ id: string }> }>(async (req, ctx) => {
  const admin = await requireAdmin();
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identifiant invalide.');
  const body = schema.parse(await readJson(req));
  const by = admin.email;
  switch (body.action) {
    case 'status':
      await setOrderStatus(id, body.status, body.note, by);
      if (body.notify) await sendStatusUpdateEmail(id, body.note).catch(() => {});
      break;
    case 'delivery_fee':
      await setDeliveryFee(id, body.fee, by);
      if (body.notify) await sendQuoteReadyEmail(id).catch(() => {});
      break;
    case 'note':
      await db()`update orders set internal_note = ${body.note}, updated_at = now() where id = ${id}`;
      break;
    case 'tracking': {
      const [o] = await db()<{ status: string }[]>`select status from orders where id = ${id}`;
      if (!o) throw new HttpError(404, 'Commande introuvable.');
      await db()`insert into delivery_tracking (order_id, status, note, created_by) values (${id}, 'info', ${body.note}, ${by})`;
      break;
    }
    case 'resend_emails':
      await resendOrderEmails(id);
      break;
  }
  return NextResponse.json({ ok: true });
});
