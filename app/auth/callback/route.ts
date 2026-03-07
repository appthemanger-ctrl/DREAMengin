// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  // Prevent open-redirects: only allow relative paths inside this app.
  const safeNext = next && next.startsWith("/") ? next : "/homedream";

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

  const supabase = createSupabaseServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      // Make this async to match modern Next/edge expectations cleanly.
      async getAll() {
        const store = await cookies();
        return store.getAll();
      },

      // Also async; Supabase may call it in async flows.
      async setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    await supabase.auth.exchangeCodeForSession(code);
  } catch {
    // If exchange fails, fall through and redirect without a session.
  }

  return response;
}
