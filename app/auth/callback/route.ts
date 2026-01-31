// FILE: app/auth/callback/route.ts
// ACTION: Copy/paste this entire file into: /app/auth/callback/route.ts (replace what’s there)
// PURPOSE: Make magic-link login WORK even if you have ZERO SQL tables built.
//          It exchanges the code for a session (sets cookies) and redirects to /home.
// NOTE: This intentionally does NOT touch public.profiles or any SQL tables.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Supabase sends users back with ?code=...
  const code = url.searchParams.get("code");

  // Optional: allow ?next=/somewhere (default to /home)
  const next = url.searchParams.get("next") || "/home";

  // If the link is missing the code, send them to login with an error flag.
  if (!code) {
    url.pathname = "/login";
    url.search = "?error=missing_code";
    return NextResponse.redirect(url);
  }

  // Build a Supabase server client that can set auth cookies properly.
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  // Exchange the code for a session (this is what logs the user in).
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  // If the user taps the SAME magic link twice, this can fail (links are basically single-use).
  if (error || !data?.session?.user) {
    url.pathname = "/login";
    url.search = "?error=callback_failed";
    return NextResponse.redirect(url);
  }

  // ✅ SUCCESS: auth cookies are now set.
  // Redirect into the app.
  return NextResponse.redirect(new URL(next, url.origin));
}
