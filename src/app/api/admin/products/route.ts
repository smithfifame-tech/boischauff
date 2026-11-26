import { NextResponse } from 'next/server';
import { apiRoute, readJson } from '@/lib/security';
import { requireAdmin } from '@/lib/auth';
import { productSchema } from './schema';
import { saveProduct } from './save';

export const dynamic = 'force-dynamic';

export const POST = apiRoute(async (req) => {
  await requireAdmin();
  const p = productSchema.parse(await readJson(req));
  const id = await saveProduct(p, null);
  return NextResponse.json({ ok: true, id });
});
