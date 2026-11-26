import { getFullOrder, canAccessOrder } from '@/lib/orders';
import { getCurrentAdmin, getCurrentUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { buildReceiptPdf } from '@/lib/pdf';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ order: string }> }) {
  const { order: number } = await ctx.params;
  const token = new URL(req.url).searchParams.get('t');
  const order = await getFullOrder({ number });
  if (!order) return new Response('Reçu introuvable', { status: 404 });
  const [user, admin] = await Promise.all([getCurrentUser().catch(() => null), getCurrentAdmin().catch(() => null)]);
  if (!canAccessOrder(order, { token, userId: user?.id, isAdmin: Boolean(admin) })) return new Response('Accès refusé', { status: 403 });
  if (order.payment_status !== 'paid' || !order.receipt) return new Response('Le reçu est disponible après confirmation du paiement.', { status: 409 });
  const pdf = await buildReceiptPdf(order, await getSettings());
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recu-${order.receipt.receipt_number}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
