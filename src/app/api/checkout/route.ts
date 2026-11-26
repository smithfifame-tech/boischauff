import { NextResponse } from 'next/server';
import { apiRoute, readJson } from '@/lib/security';
import { checkoutSchema, createOrder } from '@/lib/orders';
import { getCurrentUser } from '@/lib/auth';
import { sendOrderCreatedEmails } from '@/lib/notifications';
import { activeProvider } from '@/lib/payments';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export const POST = apiRoute(async (req) => {
  const input = checkoutSchema.parse(await readJson(req));
  const user = await getCurrentUser().catch(() => null);
  const order = await createOrder(input, user?.id ?? null);
  if (!order.existing) {
    await sendOrderCreatedEmails(order.id).catch((e) => console.error('[email] commande créée', (e as Error).message));
  }
  return NextResponse.json({
    ok: true,
    orderNumber: order.orderNumber,
    token: order.accessToken,
    status: order.status,
    provider: activeProvider(),
  });
});
