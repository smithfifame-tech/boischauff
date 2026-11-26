'use client';

function readCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
}

/** Appel API avec jeton CSRF et gestion d'erreur homogène. */
export async function api<T = Record<string, unknown>>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': readCookie('bc_csrf') },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  let data: Record<string, unknown> = {};
  try { data = await res.json(); } catch { /* réponse vide */ }
  if (!res.ok || data.ok === false) {
    const err = new Error(String(data.error || 'Une erreur est survenue. Veuillez réessayer.')) as Error & { status?: number; details?: unknown };
    err.status = res.status;
    err.details = data.details;
    throw err;
  }
  return data as T;
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
