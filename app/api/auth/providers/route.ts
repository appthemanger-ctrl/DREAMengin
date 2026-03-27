import { NextResponse } from "next/server";
import {
  GITHUB_OAUTH_UI_ENABLED,
  GOOGLE_OAUTH_UI_ENABLED,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "@/lib/supabase/env";

/**
 * GET /api/auth/providers
 *
 * Returns which OAuth providers should be exposed in this deployment. A
 * provider is only considered available when:
 *  1. the deployment has explicitly enabled its UI button, and
 *  2. Supabase reports the provider as enabled in GoTrue settings.
 *
 * Used by the login and join pages to disable OAuth buttons before
 * attempting a redirect that Google/GitHub would reject with invalid_client.
 */
export const dynamic = "force-dynamic";

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
  const googleConfigured = typeof external.google === "boolean" ? external.google : null;
  const githubConfigured = typeof external.github === "boolean" ? external.github : null;

  return {
    google:
      GOOGLE_OAUTH_UI_ENABLED === true && googleConfigured === true ? true : false,
    github:
      GITHUB_OAUTH_UI_ENABLED === true && githubConfigured === true ? true : false,
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
