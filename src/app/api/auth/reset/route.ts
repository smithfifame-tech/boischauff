import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, HttpError, readJson, sha256 } from '@/lib/security';
import { hashPassword, passwordPolicy, startUserSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const schema = z.object({ token: z.string().min(20).max(200), password: z.string().min(1).max(200) });

export const POST = apiRoute(async (req) => {
  const { token, password } = schema.parse(await readJson(req));
  const pol = passwordPolicy(password);
  if (pol) throw new HttpError(422, pol);
  const userId = await db().begin(async (sql) => {
    const [r] = await sql<{ id: number; user_id: number }[]>`
      select id, user_id from password_resets where token_hash = ${sha256(token)} and used_at is null and expires_at > now() for update`;
    if (!r) throw new HttpError(400, 'Lien invalide ou expiré. Faites une nouvelle demande.');
    await sql`update password_resets set used_at = now() where id = ${r.id}`;
    await sql`update users set password_hash = ${await hashPassword(password)}, updated_at = now() where id = ${r.user_id}`;
    return Number(r.user_id);
  });
  await startUserSession(userId);
  return NextResponse.json({ ok: true });
});
