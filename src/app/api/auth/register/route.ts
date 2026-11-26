import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, clientIp, HttpError, readJson } from '@/lib/security';
import { assertNotRateLimited, hashPassword, passwordPolicy, recordAttempt, startUserSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis.').max(80),
  lastName: z.string().trim().min(1, 'Nom requis.').max(80),
  email: z.string().trim().toLowerCase().email('E-mail invalide.').max(160),
  phone: z.string().trim().max(30).optional().default(''),
  password: z.string().min(1).max(200),
});

export const POST = apiRoute(async (req) => {
  const b = schema.parse(await readJson(req));
  const ip = clientIp(req);
  await assertNotRateLimited('user', `register:${ip}`, ip);
  const pol = passwordPolicy(b.password);
  if (pol) throw new HttpError(422, pol);
  const exists = await db()`select 1 from users where lower(email) = ${b.email}`;
  if (exists.length) {
    await recordAttempt('user', `register:${ip}`, ip, false);
    throw new HttpError(409, 'Un compte existe déjà avec cet e-mail. Connectez-vous ou réinitialisez votre mot de passe.');
  }
  const [u] = await db()<{ id: number }[]>`
    insert into users (email, password_hash, first_name, last_name, phone)
    values (${b.email}, ${await hashPassword(b.password)}, ${b.firstName}, ${b.lastName}, ${b.phone}) returning id`;
  // Rattache les commandes invité passées avec le même e-mail
  await db()`update orders set user_id = ${u.id} where user_id is null and lower(customer_email) = ${b.email}`;
  await startUserSession(Number(u.id));
  return NextResponse.json({ ok: true });
});
