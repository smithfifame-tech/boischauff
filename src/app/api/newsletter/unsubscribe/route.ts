import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Lien de désinscription (jeton personnel). */
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get('t') || '';
  if (/^[A-Za-z0-9_-]{16,80}$/.test(t)) await db()`update newsletter_subscribers set unsubscribed_at = now() where unsubscribe_token = ${t} and unsubscribed_at is null`;
  return NextResponse.redirect(new URL('/newsletter/desinscription', req.url));
}
