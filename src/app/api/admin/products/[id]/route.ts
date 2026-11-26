import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiRoute, HttpError, readJson } from '@/lib/security';
import { requireAdmin } from '@/lib/auth';
import { productSchema } from '../schema';
import { saveProduct } from '../save';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export const PUT = apiRoute<Ctx>(async (req, ctx) => {
  await requireAdmin();
  const id = Number((await ctx.params).id);
  const p = productSchema.parse(await readJson(req));
  await saveProduct(p, id);
  return NextResponse.json({ ok: true, id });
});

/** Suppression : si le produit figure dans des commandes, il est désactivé (historique conservé). */
export const DELETE = apiRoute<Ctx>(async (_req, ctx) => {
  await requireAdmin();
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Identifiant invalide.');
  const used = await db()`select 1 from order_items where product_id = ${id} limit 1`;
  if (used.length) {
    await db()`update products set is_active = false, updated_at = now() where id = ${id}`;
    return NextResponse.json({ ok: true, archived: true });
  }
  await db()`delete from products where id = ${id}`;
  return NextResponse.json({ ok: true, archived: false });
});
