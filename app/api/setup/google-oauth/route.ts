import { NextResponse } from "next/server";
import { SUPABASE_CONFIG, getServerSiteOrigin, getSupabaseAuthCallbackUrl } from "@/lib/supabase/config";

/**
 * GET /api/setup/google-oauth
 *
 * Diagnostic endpoint that explains what redirect URIs need to be configured
 * in Google Cloud Console and Supabase for Google OAuth to work.
 *
 * Returns:
 *  - supabase_callback_url  — the URI that must be added to Google Cloud Console
 *                             under Credentials → OAuth client → Authorized redirect URIs
 *  - app_callback_url       — the URI that must be in Supabase Auth → URL Configuration
 *                             → Redirect URLs (allow-list)
 *  - checks                 — what is currently detectable from env vars
 *
 * This endpoint does NOT return any secrets.
 */
export async function GET(request: Request ): Promise<NextResponse> {
  const origin = getServerSiteOrigin(new URL(request.url).origin);

  const supabaseProjectRef = SUPABASE_CONFIG.url
    ? new URL(SUPABASE_CONFIG.url).hostname.split(".")[0]
    : null;

  const supabaseCallbackUrl = getSupabaseAuthCallbackUrl();

  const appCallbackUrl = `${origin}/auth/callback`;

  const checks = [
    {
      name: "SUPABASE_URL configured",
      ok: Boolean(SUPABASE_CONFIG.url),
      value: SUPABASE_CONFIG.url ? `${new URL(SUPABASE_CONFIG.url).origin} (configured)` : "missing",
    },
    {
      name: "SUPABASE_PUBLISHABLE_KEY configured",
      ok: Boolean(SUPABASE_CONFIG.anonKey),
      value: SUPABASE_CONFIG.anonKey ? "configured" : "missing",
    },
    {
      // The Google OAuth Client ID and Secret for Supabase auth belong in the
      // Supabase Dashboard (Auth → Providers → Google), NOT in env vars.
      // This check is informational only.
      name: "Google OAuth configured in Supabase",
      ok: null,
      value:
        "Configure in Supabase Dashboard → Authentication → Providers → Google. " +
        "Do NOT set GOOGLE_OAUTH_CLIENT_SECRET in env vars — it belongs only in Supabase.",
    },
  ];

  return NextResponse.json({
    required_config_ok: checks
      .filter((c) => c.ok !== null)
      .every((c) => c.ok),
    checks,
    instructions: {
      step1: {
        title: "Google Cloud Console — add Supabase as an authorized redirect URI",
        url: "https://console.cloud.google.com/apis/credentials",
        add_to_authorized_redirect_uris: supabaseCallbackUrl,
        note:
          "Open your OAuth 2.0 Client ID, go to Authorized redirect URIs, and add the URI above. " +
          "This is the most common cause of the 400 error from Google.",
      },
      step2: {
        title: "Supabase Dashboard — configure Google provider",
        url: `https://app.supabase.io/project/${supabaseProjectRef}/auth/providers`,
        note:
          "Go to Authentication → Providers → Google. " +
          "Paste your Google Client ID and Client Secret there. " +
          "Do NOT put the client secret in .env or Vercel env vars — it belongs in the Supabase dashboard only.",
      },
      step3: {
        title: "Supabase Dashboard — add app callback to redirect URL allow-list",
        url: `https://app.supabase.io/project/${supabaseProjectRef}/auth/url-configuration`,
        add_to_redirect_urls: [
          appCallbackUrl,
          // Add any other deployment URLs from VERCEL_URL or NEXT_PUBLIC_SITE_URL:
          ...(process.env.NEXT_PUBLIC_SITE_URL
            ? [`${getServerSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL)}/auth/callback`]
            : []),
          ...(process.env.VERCEL_URL && process.env.VERCEL_URL !== new URL(appCallbackUrl).hostname
            ? [`https://${process.env.VERCEL_URL}/auth/callback`]
            : []),
        ],
        note:
          "Under Site URL and Redirect URLs, add all deployment callback URLs. " +
          "The list above is computed from this request's origin and any NEXT_PUBLIC_SITE_URL / VERCEL_URL env vars. " +
          "Also add http://localhost:3000/auth/callback for local development.",
      },
    },
    detected: {
      supabase_url: SUPABASE_CONFIG.url || null,
      supabase_callback_url: supabaseCallbackUrl,
      app_callback_url: appCallbackUrl,
    },
  });
}