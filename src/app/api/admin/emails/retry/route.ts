import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, HttpError, readJson } from '@/lib/security';
import { requireAdmin } from '@/lib/auth';
import { resendOrderEmails } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export const POST = apiRoute(async (req) => {
  await requireAdmin();
  const { logId } = z.object({ logId: z.number().int().positive() }).parse(await readJson(req));
  const [log] = await db()<{ order_id: number | null }[]>`select order_id from email_logs where id = ${logId}`;
  if (!log) throw new HttpError(404, 'Journal introuvable.');
  if (!log.order_id) throw new HttpError(422, 'Seuls les e-mails liés à une commande peuvent être renvoyés.');
  await resendOrderEmails(Number(log.order_id));
  return NextResponse.json({ ok: true });
});
