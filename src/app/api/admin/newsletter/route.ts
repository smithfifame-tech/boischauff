import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Export CSV des inscrits actifs. */
export async function GET() {
  try { await requireAdmin(); } catch { return new Response('Non autorisé', { status: 401 }); }
  const rows = await db()<{ email: string; created_at: Date }[]>`select email, created_at from newsletter_subscribers where unsubscribed_at is null order by created_at`;
  const csv = ['email;inscrit_le', ...rows.map((r) => `${r.email.replace(/[;"\n\r]/g, '')};${new Date(r.created_at).toISOString()}`)].join('\r\n');
  return new Response('﻿' + csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="newsletter.csv"', 'cache-control': 'no-store' } });
}
