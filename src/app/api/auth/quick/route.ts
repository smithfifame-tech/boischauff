import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiRoute, clientIp, HttpError, readJson } from '@/lib/security';
import { assertNotRateLimited, checkPassword, hashPassword, passwordPolicy, recordAttempt, startUserSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Connexion express : un seul formulaire (e-mail + mot de passe).
 * - Compte existant → connexion (mot de passe vérifié, limitation des tentatives).
 * - Nouvel e-mail → création du compte puis connexion. Le nom et l'adresse sont saisis à la commande.
 */
const schema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(160),
  password: z.string().min(1, 'Mot de passe requis.').max(200),
});

export const POST = apiRoute(async (req) => {
  const { email, password } = schema.parse(await readJson(req));
  const ip = clientIp(req);
  await assertNotRateLimited('user', email, ip);
  const [u] = await db()<{ id: number; password_hash: string }[]>`select id, password_hash from users where lower(email) = ${email}`;
  if (u) {
    if (!(await checkPassword(password, u.password_hash))) {
      await recordAttempt('user', email, ip, false);
      throw new HttpError(401, 'Mot de passe incorrect pour ce compte. Réessayez ou utilisez « Mot de passe oublié ».');
    }
    await recordAttempt('user', email, ip, true);
    await startUserSession(Number(u.id));
    return NextResponse.json({ ok: true, created: false });
  }
  const pol = passwordPolicy(password);
  if (pol) throw new HttpError(422, `Nouveau compte : ${pol.charAt(0).toLowerCase()}${pol.slice(1)}`);
  const [created] = await db()<{ id: number }[]>`
    insert into users (email, password_hash) values (${email}, ${await hashPassword(password)})
    on conflict do nothing returning id`;
  if (!created) throw new HttpError(409, 'Ce compte vient d\'être créé. Réessayez.');
  await db()`update orders set user_id = ${created.id} where user_id is null and lower(customer_email) = ${email}`;
  await recordAttempt('user', email, ip, true);
  await startUserSession(Number(created.id));
  return NextResponse.json({ ok: true, created: true });
});
