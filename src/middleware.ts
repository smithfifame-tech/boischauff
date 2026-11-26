import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const CSRF_COOKIE = 'bc_csrf';

async function verify(token: string | undefined, aud: string) {
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { audience: aud });
    return payload;
  } catch {
    return null;
  }
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const PUBLIC_ACCOUNT_PAGES = ['/compte/connexion', '/compte/inscription', '/compte/mot-de-passe-oublie', '/compte/reinitialiser'];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  let res = NextResponse.next();

  // Espace administrateur
  if (pathname.startsWith('/admin') && pathname !== '/admin/connexion') {
    const payload = await verify(req.cookies.get('bc_admin')?.value, 'admin');
    if (!payload) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/connexion';
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      res = NextResponse.redirect(url);
    } else if (payload.mcp === true && pathname !== '/admin/mot-de-passe') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/mot-de-passe';
      url.search = '';
      res = NextResponse.redirect(url);
    }
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store');
  }

  // Espace client
  if (pathname.startsWith('/compte') && !PUBLIC_ACCOUNT_PAGES.includes(pathname)) {
    const payload = await verify(req.cookies.get('bc_session')?.value, 'customer');
    if (!payload) {
      const url = req.nextUrl.clone();
      url.pathname = '/compte/connexion';
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      res = NextResponse.redirect(url);
    }
  }

  // Jeton CSRF (double soumission) disponible pour le JavaScript du site
  if (!req.cookies.get(CSRF_COOKIE)) {
    res.cookies.set(CSRF_COOKIE, randomToken(), {
      httpOnly: false,
      sameSite: 'lax',
      secure: req.nextUrl.protocol === 'https:',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|api/webhooks).*)'],
};
