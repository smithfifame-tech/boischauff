import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { activeProvider } from '@/lib/payments';
import { mailTransportName } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function GET() {
  let database = 'ok';
  try { await db()`select 1 from settings limit 1`; } catch (e) { database = `error: ${(e as Error).message.slice(0, 120)}`; }
  return NextResponse.json({ ok: database === 'ok', database, payment: activeProvider(), email: mailTransportName() });
}
