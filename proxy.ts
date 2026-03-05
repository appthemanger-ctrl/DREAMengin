/**
 * DREAMengin — Next.js 16 Edge Proxy
 *
 * Two responsibilities:
 *  1. Supabase session-refresh proxy — refreshes auth cookies on every
 *     request so that Server Components always receive a live session.
 *  2. Host-based domain block — any request arriving with a Host header
 *     of theboogieman.ai (or any subdomain) is rejected immediately at
 *     the edge before it ever reaches application code.
 *
 * Next.js 16.1.6 renamed "middleware" to "proxy".  The entry point must be
 * this file (proxy.ts) and the export must be named `proxy`.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/supabase/env';

// ── Blocked hosts ─────────────────────────────────────────────────────────────
const BLOCKED_HOST = 'theboogieman.ai';

export async function proxy(request: NextRequest) {
  // 1. Reject requests whose Host header is the blocked domain.
  //    This covers the case where theboogieman.ai is configured as a
  //    reverse proxy / custom domain pointing at this deployment.
  const host = (request.headers.get('host') ?? '').toLowerCase();
  if (host === BLOCKED_HOST || host.endsWith(`.${BLOCKED_HOST}`)) {
    return new NextResponse('Access denied.', { status: 403 });
  }

  // 2. Supabase session-refresh proxy.
  //    Creates a response that forwards all request cookies, calls
  //    getUser() to refresh the session, then writes updated auth
  //    cookies back onto the response before handing off.

  // If Supabase is not configured (e.g. local dev without .env.local),
  // skip session refresh and just continue.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  // Start with a passthrough response that carries the incoming request
  // headers/cookies so that Server Components can read them.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Write cookies onto the *request* object first so that any
        // Server Component rendered during this request can read them.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // Replace the response with a fresh one that carries both the
        // updated request headers and the new Set-Cookie headers.
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: Do not add any logic between createServerClient and
  // getUser() — a proxy bug here can cause random auth failures.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     *  - _next/static  (static assets)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - common image/font extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};
