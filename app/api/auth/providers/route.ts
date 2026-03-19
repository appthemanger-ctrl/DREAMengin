import { NextResponse } from "next/server";
import { SUPABASE_URL } from "@/lib/supabase/env";

/**
 * GET /api/auth/providers
 *
 * Returns which OAuth providers are currently enabled in this Supabase project
 * by querying the public GoTrue /auth/v1/settings endpoint.
 *
 * Used by the login and join pages to disable OAuth buttons before
 * attempting a redirect that Google/GitHub would reject with invalid_client.
 */
export const dynamic = "force-dynamic";

interface SupabaseAuthSettings {
  external?: Record<string, boolean>;
}

export async function GET() {
  if (!SUPABASE_URL) {
    return NextResponse.json({ google: false, github: false });
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`);

    if (!res.ok) {
      return NextResponse.json({ google: false, github: false });
    }

    const settings: SupabaseAuthSettings = await res.json();
    const external = settings.external ?? {};

    return NextResponse.json(
      { google: Boolean(external.google), github: Boolean(external.github) },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
    );
  } catch {
    return NextResponse.json({ google: false, github: false });
  }
}
