import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRoute, readJson } from '@/lib/security';
import { initPayment } from '@/lib/payments';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const schema = z.object({ orderNumber: z.string().min(5).max(40), token: z.string().min(10).max(100) });

export const POST = apiRoute(async (req) => {
  const { orderNumber, token } = schema.parse(await readJson(req));
  const r = await initPayment(orderNumber, token);
  return NextResponse.json({ ok: true, redirectUrl: r.redirectUrl, provider: r.provider, reused: r.reused });
});
