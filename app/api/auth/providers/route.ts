import { NextResponse } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * GET /api/auth/providers
 *
 * Returns which OAuth providers are currently enabled in this Supabase project
 * by querying the public GoTrue /auth/v1/settings endpoint.
 *
 * Used by the login and join pages to disable OAuth buttons before
 * attempting a redirect that Google/GitHub would reject with invalid_client.
 */
interface SupabaseAuthSettings {
  external?: Record<string, boolean>;
}

export interface OAuthProvidersResponse {
  google: boolean | null;
  github: boolean | null;
}

export const UNKNOWN_OAUTH_PROVIDERS: OAuthProvidersResponse = {
  google: null,
  github: null,
};

export function getOAuthProvidersResponse(
  settings: SupabaseAuthSettings,
): OAuthProvidersResponse {
  const external = settings.external ?? {};

  return {
    google: typeof external.google === "boolean" ? external.google : null,
    github: typeof external.github === "boolean" ? external.github : null,
  };
}

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(UNKNOWN_OAUTH_PROVIDERS, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      cache: "no-store",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json(UNKNOWN_OAUTH_PROVIDERS, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const settings: SupabaseAuthSettings = await res.json();

    return NextResponse.json(
      getOAuthProvidersResponse(settings),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(UNKNOWN_OAUTH_PROVIDERS, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
