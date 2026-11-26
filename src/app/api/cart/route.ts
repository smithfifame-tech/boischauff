import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, randomToken, readJson } from '@/lib/security';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const CART_COOKIE = 'bc_cart';

const schema = z.object({
  items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().positive().max(1_000_000), unit: z.enum(['kg', 't']) })).max(30),
});

/** Restaure le panier enregistré côté serveur (cookie ou compte client). */
export const GET = apiRoute(async () => {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  const user = await getCurrentUser().catch(() => null);
  const rows = await db()<{ id: number }[]>`
    select id from carts where (${token ?? ''} <> '' and token = ${token ?? ''}) or (${user?.id ?? 0} > 0 and user_id = ${user?.id ?? 0})
    order by updated_at desc limit 1`;
  if (!rows[0]) return NextResponse.json({ ok: true, items: [] });
  const items = await db()<{ product_id: number; quantity: string; unit: 'kg' | 't' }[]>`
    select ci.product_id, ci.quantity, ci.unit from cart_items ci join products p on p.id = ci.product_id and p.is_active
    where ci.cart_id = ${rows[0].id} order by ci.id`;
  return NextResponse.json({ ok: true, items: items.map((i) => ({ productId: Number(i.product_id), quantity: Number(i.quantity), unit: i.unit })) });
});

/** Enregistre le panier (persistance en cas de rechargement ou de changement d'appareil une fois connecté). */
export const PUT = apiRoute(async (req) => {
  const body = schema.parse(await readJson(req));
  const jar = await cookies();
  let token = jar.get(CART_COOKIE)?.value;
  if (!token) {
    token = randomToken(24);
    jar.set(CART_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 60 });
  }
  const user = await getCurrentUser().catch(() => null);
  await db().begin(async (sql) => {
    const [cart] = await sql<{ id: number }[]>`
      insert into carts (token, user_id) values (${token as string}, ${user?.id ?? null})
      on conflict (token) do update set updated_at = now(), user_id = coalesce(excluded.user_id, carts.user_id)
      returning id`;
    await sql`delete from cart_items where cart_id = ${cart.id}`;
    const seen = new Set<number>();
    for (const it of body.items) {
      if (seen.has(it.productId)) continue;
      seen.add(it.productId);
      await sql`insert into cart_items (cart_id, product_id, quantity, unit)
                select ${cart.id}, id, ${it.quantity}, ${it.unit} from products where id = ${it.productId}`;
    }
  });
  return NextResponse.json({ ok: true });
});
