import { NextRequest, NextResponse } from 'next/server';
import { evaluateHorizon } from '@/lib/security/horizon-firewall';

export const config = {
  // Apply to everything except static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Baseline security headers (cheap wins).
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // CSP: keep it permissive enough for “fun stuff” (embeds/widgets/socials), but not wide open.
  // You can extend allowed frames via HORIZON_CSP_FRAME_SRC (space-separated origins).
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

  // NOTE: Next.js can require 'unsafe-eval' in some dev/build toolchains.
  // Keep it for now; tighten when you’re stable.
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

  const verdict = await evaluateHorizon(req);

  // Always attach a tiny “boundary record” for debugging (safe, not sensitive).
  res.headers.set('X-Horizon-Mode', verdict.mode);
  res.headers.set('X-Horizon-Decision', verdict.decision);

  // Apply cookie ledger updates (signed).
  if (verdict.setCookie) {
    res.headers.append('Set-Cookie', verdict.setCookie);
  }

  if (verdict.decision === 'block') {
    return new NextResponse('Blocked by Horizon Firewall', { status: 403, headers: res.headers });
  }

  if (verdict.decision === 'challenge') {
    // Minimal “soft wall”: slow down the request.
    // This is intentionally lightweight; heavier challenges can be added later.
    const delayMs = verdict.delayMs ?? 600;
    await new Promise((r) => setTimeout(r, delayMs));
    return res;
  }

  return res;
}
