import 'server-only';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './db';
import { HttpError } from './security';

export const USER_COOKIE = 'bc_session';
export const ADMIN_COOKIE = 'bc_admin';
const USER_TTL = 60 * 60 * 24 * 7; // 7 jours
const ADMIN_TTL = 60 * 60 * 8;     // 8 heures

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error('AUTH_SECRET manquant ou trop court (32 caractères minimum).');
  return new TextEncoder().encode(s);
}

export async function hashPassword(pw: string) { return bcrypt.hash(pw, 12); }
export async function checkPassword(pw: string, hash: string) { return bcrypt.compare(pw, hash); }

export function passwordPolicy(pw: string): string | null {
  if (pw.length < 10) return 'Le mot de passe doit contenir au moins 10 caractères.';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Le mot de passe doit contenir des lettres et des chiffres.';
  return null;
}

async function sign(payload: Record<string, unknown>, ttl: number, aud: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setAudience(aud)
    .setExpirationTime(`${ttl}s`)
    .sign(secretKey());
}

async function verify(token: string | undefined, aud: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { audience: aud });
    return payload;
  } catch {
    return null;
  }
}

const cookieBase = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

// ------------------------------------------------------------------ clients
export interface SessionUser { id: number; email: string; first_name: string; last_name: string; phone: string }

export async function startUserSession(userId: number) {
  const token = await sign({ sub: String(userId) }, USER_TTL, 'customer');
  (await cookies()).set(USER_COOKIE, token, { ...cookieBase, maxAge: USER_TTL });
}
export async function endUserSession() { (await cookies()).delete(USER_COOKIE); }

export async function getCurrentUser(): Promise<SessionUser | null> {
  const payload = await verify((await cookies()).get(USER_COOKIE)?.value, 'customer');
  if (!payload?.sub) return null;
  const rows = await db()<SessionUser[]>`select id, email, first_name, last_name, phone from users where id = ${Number(payload.sub)}`;
  return rows[0] ? { ...rows[0], id: Number(rows[0].id) } : null;
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) throw new HttpError(401, 'Veuillez vous connecter.');
  return u;
}

// ------------------------------------------------------------------ administrateurs
export interface SessionAdmin { id: number; email: string; name: string; must_change_password: boolean }

export async function startAdminSession(adminId: number, mustChange: boolean) {
  const token = await sign({ sub: String(adminId), mcp: mustChange }, ADMIN_TTL, 'admin');
  (await cookies()).set(ADMIN_COOKIE, token, { ...cookieBase, sameSite: 'strict', maxAge: ADMIN_TTL });
}
export async function endAdminSession() { (await cookies()).delete(ADMIN_COOKIE); }

export async function getCurrentAdmin(): Promise<SessionAdmin | null> {
  const payload = await verify((await cookies()).get(ADMIN_COOKIE)?.value, 'admin');
  if (!payload?.sub) return null;
  const rows = await db()<SessionAdmin[]>`select id, email, name, must_change_password from admins where id = ${Number(payload.sub)}`;
  return rows[0] ? { ...rows[0], id: Number(rows[0].id) } : null;
}

/** Pour les routes API admin : session valide ET mot de passe initial changé. */
export async function requireAdmin(opts: { allowMustChange?: boolean } = {}): Promise<SessionAdmin> {
  const a = await getCurrentAdmin();
  if (!a) throw new HttpError(401, 'Session administrateur requise.');
  if (a.must_change_password && !opts.allowMustChange) throw new HttpError(403, 'Veuillez d\'abord changer votre mot de passe.');
  return a;
}

export { verify as verifyToken };

// ------------------------------------------------------------------ limitation des tentatives
const WINDOW_MIN = 15;
const MAX_PER_ID = 5;
const MAX_PER_IP = 25;

export async function assertNotRateLimited(scope: 'user' | 'admin' | 'reset' | 'track' | 'newsletter' | 'review', identifier: string, ip: string) {
  const [row] = await db()<{ by_id: number; by_ip: number }[]>`
    select
      count(*) filter (where identifier = ${identifier} and not success)::int as by_id,
      count(*) filter (where ip = ${ip} and not success)::int as by_ip
    from login_attempts
    where scope = ${scope} and created_at > now() - make_interval(mins => ${WINDOW_MIN})`;
  if ((row?.by_id ?? 0) >= MAX_PER_ID || (ip && (row?.by_ip ?? 0) >= MAX_PER_IP)) {
    throw new HttpError(429, `Trop de tentatives. Réessayez dans ${WINDOW_MIN} minutes.`);
  }
}

export async function recordAttempt(scope: string, identifier: string, ip: string, success: boolean) {
  await db()`insert into login_attempts (scope, identifier, ip, success) values (${scope}, ${identifier}, ${ip}, ${success})`;
  if (success) {
    await db()`delete from login_attempts where scope = ${scope} and identifier = ${identifier} and not success`;
  }
}
