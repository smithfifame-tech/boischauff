import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, clientIp, HttpError, readJson } from '@/lib/security';
import { assertNotRateLimited, checkPassword, recordAttempt, startAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });
const DUMMY = '$2b$12$8EmdnaQR0F52NBEQ4xVyCORsD0t26.tZKN0X6xm8J0/girc4PruWy';

export const POST = apiRoute(async (req) => {
  const { email, password } = schema.parse(await readJson(req));
  const ip = clientIp(req);
  await assertNotRateLimited('admin', email, ip);
  const [a] = await db()<{ id: number; password_hash: string; must_change_password: boolean }[]>`
    select id, password_hash, must_change_password from admins where lower(email) = ${email}`;
  const ok = await checkPassword(password, a?.password_hash ?? DUMMY);
  if (!a || !ok) {
    await recordAttempt('admin', email, ip, false);
    throw new HttpError(401, 'Identifiants incorrects.');
  }
  await recordAttempt('admin', email, ip, true);
  await db()`update admins set last_login_at = now() where id = ${a.id}`;
  await startAdminSession(Number(a.id), a.must_change_password);
  return NextResponse.json({ ok: true, mustChangePassword: a.must_change_password });
});
