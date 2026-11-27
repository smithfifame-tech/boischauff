import 'server-only';
import { db, num } from './db';

export interface PublicReview { id: number; author: string; city: string; rating: number; comment: string; date: string }
export interface ReviewStats { count: number; average: number; distribution: number[] }

/** Prénom + initiale du nom : « Claire D. » */
export function displayName(first: string, last: string) {
  const f = first.trim(); const l = last.trim();
  return f ? `${f}${l ? ` ${l.charAt(0).toUpperCase()}.` : ''}` : 'Client vérifié';
}

export async function getApprovedReviews(limit = 30): Promise<PublicReview[]> {
  const rows = await db()<{ id: number; author_name: string; city: string; rating: number; comment: string; created_at: Date }[]>`
    select id, author_name, city, rating, comment, created_at from reviews where status = 'approved' order by created_at desc limit ${limit}`;
  return rows.map((r) => ({ id: Number(r.id), author: r.author_name, city: r.city, rating: Number(r.rating), comment: r.comment, date: new Date(r.created_at).toISOString() }));
}

export async function getReviewStats(): Promise<ReviewStats> {
  const rows = await db()<{ rating: number; n: number }[]>`select rating, count(*)::int as n from reviews where status = 'approved' group by rating`;
  const distribution = [0, 0, 0, 0, 0];
  let count = 0; let sum = 0;
  for (const r of rows) { distribution[Number(r.rating) - 1] = Number(r.n); count += Number(r.n); sum += Number(r.rating) * Number(r.n); }
  return { count, average: count ? Math.round((sum / count) * 10) / 10 : 0, distribution };
}

/** Note moyenne par produit, calculée sur les avis approuvés des commandes contenant ce produit. */
export async function getProductRatings(): Promise<Record<number, { average: number; count: number }>> {
  const rows = await db()<{ product_id: number; avg: string; n: number }[]>`
    select oi.product_id, avg(r.rating)::numeric(3,1) as avg, count(distinct r.id)::int as n
    from reviews r join order_items oi on oi.order_id = r.order_id
    where r.status = 'approved' and oi.product_id is not null group by oi.product_id`;
  const out: Record<number, { average: number; count: number }> = {};
  for (const r of rows) out[Number(r.product_id)] = { average: num(r.avg), count: Number(r.n) };
  return out;
}

/** Commandes réellement payées (hors démonstration) d'un client, avec l'éventuel avis déjà laissé. */
export async function reviewableOrders(userId: number) {
  return db()<{ order_number: string; created_at: Date; review_status: string | null; rating: number | null }[]>`
    select o.order_number, o.created_at, r.status as review_status, r.rating
    from orders o left join reviews r on r.order_id = o.id
    where o.user_id = ${userId} and o.payment_status = 'paid' and not o.is_demo
    order by o.created_at desc limit 50`;
}
