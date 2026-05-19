// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClientWithCustomCookies } from "@/lib/supabase/server";
import { SUPABASE_CONFIG } from "@/lib/supabase/config";
import { resolveSafeNextPath } from "@/lib/auth/nextRedirect";

export async function GET(request: Request ): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Prevent open-redirects: only allow relative paths inside this app.
  const safeNext = resolveSafeNextPath(next);

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

  if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) return response;
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

  const supabase = createServerClientWithCustomCookies(
    () => cookieStore.getAll(),
    (cookiesToSet: CookieToSet[]) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
    }
  );

  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      // Exchange failed — redirect to login with error
      const loginUrl = new URL("/login", url.origin);
      loginUrl.searchParams.set("error", "exchange_failed");
      loginUrl.searchParams.set("error_description", exchangeError.message);
      return NextResponse.redirect(loginUrl);
    }
  } catch (err: unknown) {
    // Unexpected exception during PKCE exchange — redirect to login with error
    // so the user sees a helpful message instead of a silent broken redirect.
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "exchange_failed");
    loginUrl.searchParams.set(
      "error_description",
      (err as { message?: string })?.message ?? "Unexpected error during sign-in"
    );
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
