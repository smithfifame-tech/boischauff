import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, clientIp, HttpError, readJson } from '@/lib/security';
import { assertNotRateLimited, checkPassword, recordAttempt, startUserSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const schema = z.object({ email: z.string().trim().toLowerCase().email('E-mail invalide.'), password: z.string().min(1).max(200) });
const DUMMY = '$2b$12$8EmdnaQR0F52NBEQ4xVyCORsD0t26.tZKN0X6xm8J0/girc4PruWy';

export const POST = apiRoute(async (req) => {
  const { email, password } = schema.parse(await readJson(req));
  const ip = clientIp(req);
  await assertNotRateLimited('user', email, ip);
  const [u] = await db()<{ id: number; password_hash: string }[]>`select id, password_hash from users where lower(email) = ${email}`;
  const ok = await checkPassword(password, u?.password_hash ?? DUMMY);
  if (!u || !ok) {
    await recordAttempt('user', email, ip, false);
    throw new HttpError(401, 'E-mail ou mot de passe incorrect.');
  }
  await recordAttempt('user', email, ip, true);
  await startUserSession(Number(u.id));
  return NextResponse.json({ ok: true });
});
