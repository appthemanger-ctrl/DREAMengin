// middleware.ts
//
// Supabase SSR requires a middleware that calls supabase.auth.getUser() on
// every request so the session tokens (access + refresh) are automatically
// rotated before they expire.  Without this the browser still holds cookies
// that look valid but the server-side client finds no active session — the
// user is effectively logged out even though they just signed in.
//
// This follows the canonical @supabase/ssr pattern:
//   https://supabase.com/docs/guides/auth/server-side/nextjs

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  // If Supabase is not configured, pass through without modification.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  // Start with a plain pass-through response.  Cookie mutations below will
  // be applied to THIS object so they reach the browser in the same response.
  let supabaseResponse = NextResponse.next({ request });

  // Build a Supabase client that reads cookies from the incoming request and
  // writes any refreshed tokens back onto the outgoing response.
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Mutate the request cookies so server components in this request see
        // the new tokens.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // Rebuild the response so the Set-Cookie headers make it to the
        // browser (required after mutating request.cookies).
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: calling getUser() triggers a silent token refresh when the
  // access token has expired.  Do NOT remove this call — it is what keeps
  // sessions alive between page loads.
  await supabase.auth.getUser();

  return supabaseResponse;
}

// Run on every route except Next.js internals and static assets.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
