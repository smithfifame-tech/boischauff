import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, clientIp, randomToken, readJson } from '@/lib/security';
import { assertNotRateLimited, recordAttempt } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const schema = z.object({ email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(160), consent: z.literal(true, { errorMap: () => ({ message: 'Merci d\'accepter de recevoir nos e-mails.' }) }) });

export const POST = apiRoute(async (req) => {
  const ip = clientIp(req);
  await assertNotRateLimited('newsletter', `ip:${ip}`, ip);
  const { email } = schema.parse(await readJson(req));
  await db()`
    insert into newsletter_subscribers (email, unsubscribe_token) values (${email}, ${randomToken(24)})
    on conflict ((lower(email))) do update set unsubscribed_at = null`;
  // Compte comme « tentative » pour limiter les inscriptions en rafale depuis une même IP.
  await recordAttempt('newsletter', `ip:${ip}`, ip, false);
  return NextResponse.json({ ok: true });
});
