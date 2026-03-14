// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Prevent open-redirects: only allow relative paths inside this app.
  const safeNext = next && next.startsWith("/") ? next : "/homedream";

  // If OAuth provider returned an error, redirect to login with error info
  if (error) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", error);
    if (errorDescription) {
      loginUrl.searchParams.set("error_description", errorDescription);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Build the redirect response FIRST so we can attach auth cookies to it.
  const redirectUrl = new URL(safeNext, url.origin);
  const response = NextResponse.redirect(redirectUrl);

  if (!code) return response;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return response;

  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof response.cookies.set>[2];
  };

  // Resolve the cookie store ONCE before building the Supabase client.
  // @supabase/ssr calls getAll() as a synchronous snapshot getter — it does
  // NOT await a returned Promise. If getAll() is async and cookies() is
  // awaited inside it, the library receives a Promise<cookie[]> instead of
  // cookie[], silently finds no code_verifier, and the PKCE exchange fails
  // with a 400 from Supabase's token endpoint.
  // This matches the canonical pattern in lib/supabase/server.ts.
  const cookieStore = await cookies();

  const supabase = createSupabaseServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      // Synchronous: returns the pre-resolved snapshot.
      getAll() {
        return cookieStore.getAll();
      },

      // Synchronous: writes session tokens (and deletes the code_verifier
      // cookie) onto the redirect response so they reach the browser.
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      // Exchange failed — redirect to login with error
      const loginUrl = new URL("/login", url.origin);
      loginUrl.searchParams.set("error", "exchange_failed");
      loginUrl.searchParams.set("error_description", exchangeError.message);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    // If exchange fails, fall through and redirect without a session.
  }

  return response;
}
