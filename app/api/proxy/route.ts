import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { evaluateHorizon } from '@/lib/security/horizon-firewall';

export const runtime = 'edge'; // works on Vercel Edge

function withBaseSecurityHeaders(res: NextResponse) {
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

  return res;
}

function makeSupabase(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // keep request + response in sync
            req.cookies.set({ name, value, ...options });
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );
}

// This endpoint doesn’t “proxy” to another origin.
// It’s a security/auth gate you call before doing whatever action you want.
export async function GET(req: NextRequest) {
  let res = withBaseSecurityHeaders(NextResponse.json({ ok: true }));

  // 1) Refresh Supabase session (updates cookies if needed)
  const supabase = makeSupabase(req, res);
  await supabase.auth.getUser();

  // 2) Horizon firewall decision
  const verdict = await evaluateHorizon(req);
  res.headers.set('X-Horizon-Mode', verdict.mode);
  res.headers.set('X-Horizon-Decision', verdict.decision);

  if (verdict.setCookie) res.headers.append('Set-Cookie', verdict.setCookie);

  if (verdict.decision === 'block') {
    return new NextResponse('Blocked by Horizon Firewall', {
      status: 403,
      headers: res.headers,
    });
  }

  if (verdict.decision === 'challenge') {
    const delayMs = verdict.delayMs ?? 600;
    await new Promise((r) => setTimeout(r, delayMs));
    // still allow, just delayed
  }

  return res;
}

// Optional: accept POST too, same behavior
export async function POST(req: NextRequest) {
  return GET(req);
}
