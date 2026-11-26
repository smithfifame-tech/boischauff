import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, clientIp, randomToken, readJson, sha256 } from '@/lib/security';
import { assertNotRateLimited, recordAttempt } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/notifications';
import { siteUrl } from '@/lib/settings';

export const dynamic = 'force-dynamic';
const schema = z.object({ email: z.string().trim().toLowerCase().email('E-mail invalide.') });

/** Réponse identique que le compte existe ou non (pas d'énumération des comptes). */
export const POST = apiRoute(async (req) => {
  const { email } = schema.parse(await readJson(req));
  const ip = clientIp(req);
  await assertNotRateLimited('reset', email, ip);
  await recordAttempt('reset', email, ip, false);
  const [u] = await db()<{ id: number }[]>`select id from users where lower(email) = ${email}`;
  if (u) {
    const token = randomToken(32);
    await db()`insert into password_resets (user_id, token_hash, expires_at) values (${u.id}, ${sha256(token)}, now() + interval '1 hour')`;
    await sendPasswordResetEmail(email, `${siteUrl()}/compte/reinitialiser?token=${encodeURIComponent(token)}`);
  }
  return NextResponse.json({ ok: true });
});
