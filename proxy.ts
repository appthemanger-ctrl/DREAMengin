// ./proxy.ts (Next.js 16 compatible)
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { evaluateHorizon } from '@/lib/security/horizon-firewall';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (
    path.startsWith('/_next/static') ||
    path.startsWith('/_next/image') ||
    path === '/favicon.ico' ||
    path === '/robots.txt' ||
    path === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const extraFrames = process.env.HORIZON_CSP_FRAME_SRC || '';
  const frameAllow = [
    "'self'",
    'https://phet.colorado.edu',
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com',
    'https://player.twitch.tv',
    'https://open.spotify.com',
    'https://w.soundcloud.com',
    'https://soundcloud.com',
    'https://player.vimeo.com',
    'https://vimeo.com',
    'https://www.instagram.com',
    'https://www.tiktok.com',
  ].concat(extraFrames.split(/\s+/).filter(Boolean));

  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      `frame-src ${frameAllow.join(' ')}`,
      "connect-src 'self' https: wss:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...(options ?? {}) });
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const publicRoutes = ['/', '/login', '/auth/callback', '/about'];
    const isPublicRoute = publicRoutes.some((route) => path === route) || path.startsWith('/profile/');

    const isStaticOrApi =
      path.startsWith('/_next') || path.startsWith('/api') || path.includes('.') || path.startsWith('/public');

    const makeRedirect = (pathname: string) => {
      const url = req.nextUrl.clone();
      url.pathname = pathname;
      const redirectRes = NextResponse.redirect(url);

      res.cookies.getAll().forEach((c) => redirectRes.cookies.set(c));
      res.headers.forEach((v, k) => redirectRes.headers.set(k, v));

      return redirectRes;
    };

    if (!user && !isPublicRoute && !isStaticOrApi) {
      return makeRedirect('/');
    }

    if (user && path === '/') {
      return makeRedirect('/home');
    }
  }

  const verdict = await evaluateHorizon(req);

  res.headers.set('X-Horizon-Mode', verdict.mode);
  res.headers.set('X-Horizon-Decision', verdict.decision);

  if (verdict.setCookie) {
    res.headers.append('Set-Cookie', verdict.setCookie);
  }

  if (verdict.decision === 'block') {
    return new NextResponse('Blocked by Horizon Firewall', {
      status: 403,
      headers: res.headers,
    });
  }

  if (verdict.decision === 'challenge') {
    const delayMs = verdict.delayMs ?? 600;
    await new Promise((r) => setTimeout(r, delayMs));
    return res;
  }

  return res;
} 
