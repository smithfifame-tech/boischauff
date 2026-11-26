import 'server-only';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const CSRF_COOKIE = 'bc_csrf';
export const CSRF_HEADER = 'x-csrf-token';

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '';
}

/** Vérifie que la requête provient bien du site (Origin/Referer) et porte le jeton CSRF. */
export function verifyCsrf(req: Request): boolean {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const origin = req.headers.get('origin') || req.headers.get('referer');
  if (!host || !origin) return false;
  let originHost = '';
  try { originHost = new URL(origin).host; } catch { return false; }
  if (originHost !== host) return false;
  const header = req.headers.get(CSRF_HEADER) || '';
  const cookie = parseCookie(req.headers.get('cookie') || '')[CSRF_COOKIE] || '';
  if (!header || !cookie) return false;
  return safeEqual(header, cookie);
}

export function parseCookie(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (!k) continue;
    try { out[k] = decodeURIComponent(part.slice(i + 1).trim()); } catch { out[k] = part.slice(i + 1).trim(); }
  }
  return out;
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) { super(message); }
}

export function jsonError(status: number, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

/** Enveloppe une route API : CSRF sur les mutations, erreurs propres, aucun secret exposé. */
export function apiRoute<C = unknown>(
  handler: (req: Request, ctx: C) => Promise<Response>,
  opts: { csrf?: boolean } = { csrf: true },
) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      if (opts.csrf !== false && req.method !== 'GET' && req.method !== 'HEAD') {
        if (!verifyCsrf(req)) return jsonError(403, 'Requête refusée (protection CSRF). Rechargez la page et réessayez.');
      }
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return jsonError(e.status, e.message, e.details);
      if (e instanceof ZodError) {
        const first = e.issues[0];
        return jsonError(422, first?.message || 'Données invalides.', e.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
      }
      console.error('[api] erreur interne', (e as Error)?.message);
      return jsonError(500, 'Une erreur interne est survenue. Veuillez réessayer.');
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  const ct = req.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new HttpError(415, 'Format de requête non supporté.');
  const text = await req.text();
  if (text.length > 100_000) throw new HttpError(413, 'Requête trop volumineuse.');
  try { return JSON.parse(text); } catch { throw new HttpError(400, 'JSON invalide.'); }
}
