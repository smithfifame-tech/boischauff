import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, HttpError, readJson } from '@/lib/security';
import { checkPassword, hashPassword, passwordPolicy, requireAdmin, startAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const schema = z.object({ current: z.string().min(1).max(200), next: z.string().min(1).max(200) });

export const POST = apiRoute(async (req) => {
  const admin = await requireAdmin({ allowMustChange: true });
  const { current, next } = schema.parse(await readJson(req));
  const pol = passwordPolicy(next);
  if (pol) throw new HttpError(422, pol);
  if (current === next) throw new HttpError(422, 'Le nouveau mot de passe doit être différent de l\'actuel.');
  const [a] = await db()<{ password_hash: string }[]>`select password_hash from admins where id = ${admin.id}`;
  if (!a || !(await checkPassword(current, a.password_hash))) throw new HttpError(401, 'Mot de passe actuel incorrect.');
  await db()`update admins set password_hash = ${await hashPassword(next)}, must_change_password = false where id = ${admin.id}`;
  await startAdminSession(admin.id, false);
  return NextResponse.json({ ok: true });
});
