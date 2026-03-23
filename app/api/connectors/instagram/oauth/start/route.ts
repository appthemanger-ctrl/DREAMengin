/**
 * app/api/connectors/instagram/oauth/start/route.ts
 *
 * GET /api/connectors/instagram/oauth/start
 *
 * Initiates the Instagram Basic Display API OAuth 2.0 flow.
 * Redirects the browser to Instagram's authorization endpoint.
 *
 * Required env vars:
 *   INSTAGRAM_CLIENT_ID  — App ID from Meta for Developers (Basic Display app)
 *   NEXT_PUBLIC_SITE_URL — Canonical app URL for the redirect_uri
 *
 * The callback URL must be registered in the Meta app as a valid OAuth
 * redirect URI:
 *   https://your-site.com/api/connectors/instagram/oauth/callback
 *
 * AXIOM 4 — Security by Default: App Secret is never sent in this redirect.
 * ARCHITECTURE.md §3 — Auth flow lives in API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const IG_AUTH_URL = 'https://api.instagram.com/oauth/authorize';

// Basic Display API scope — access to user's own media
const IG_SCOPE = 'user_profile,user_media';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const clientId = process.env.INSTAGRAM_CLIENT_ID ?? '';
  if (!clientId) {
    return NextResponse.json(
      { error: 'INSTAGRAM_CLIENT_ID is not configured. Add it in Vercel environment variables.' },
      { status: 503 },
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : '');

  const origin = siteUrl || new URL(req.url).origin;
  const redirectUri = `${origin}/api/connectors/instagram/oauth/callback`;

  // CSRF state
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set('ig_oauth_state', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   600, // 10 minutes
    path:     '/',
  });

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    scope:         IG_SCOPE,
    response_type: 'code',
    state,
  });

  return NextResponse.redirect(`${IG_AUTH_URL}?${params.toString()}`);
}
