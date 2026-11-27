import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, clientIp, HttpError, readJson } from '@/lib/security';
import { assertNotRateLimited, getCurrentUser, recordAttempt } from '@/lib/auth';
import { displayName } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

const schema = z.object({
  orderNumber: z.string().trim().min(4).max(40),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10, 'Votre avis doit faire au moins 10 caractères.').max(1200),
});

/** Avis vérifié : réservé au titulaire d'une commande réellement payée ; publié après modération. */
export const POST = apiRoute(async (req) => {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'Connectez-vous pour laisser un avis.');
  const b = schema.parse(await readJson(req));
  const ip = clientIp(req);
  await assertNotRateLimited('review', String(user.id), ip);
  const [o] = await db()<{ id: number; customer_first_name: string; customer_last_name: string; city: string | null }[]>`
    select o.id, o.customer_first_name, o.customer_last_name,
      (select a.city from addresses a where a.order_id = o.id order by a.id limit 1) as city
    from orders o
    where o.order_number = ${b.orderNumber} and o.user_id = ${user.id} and o.payment_status = 'paid' and not o.is_demo`;
  if (!o) {
    await recordAttempt('review', String(user.id), ip, false);
    throw new HttpError(403, 'Seules vos commandes payées peuvent recevoir un avis.');
  }
  const ins = await db()`
    insert into reviews (order_id, user_id, author_name, city, rating, comment)
    values (${o.id}, ${user.id}, ${displayName(o.customer_first_name, o.customer_last_name)}, ${o.city ?? ''}, ${b.rating}, ${b.comment})
    on conflict (order_id) do nothing returning id`;
  if (!ins.length) throw new HttpError(409, 'Vous avez déjà laissé un avis pour cette commande.');
  return NextResponse.json({ ok: true, status: 'pending' });
});
