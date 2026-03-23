/**
 * app/api/connectors/youtube/oauth/start/route.ts
 *
 * GET /api/connectors/youtube/oauth/start
 *
 * Initiates the Google OAuth 2.0 PKCE flow for the YouTube connector.
 * Redirects the browser to Google's authorization endpoint.
 *
 * Required env vars (set in Vercel + GitHub Actions):
 *   GOOGLE_CLIENT_ID     — OAuth 2.0 client ID from Google Cloud Console
 *   NEXT_PUBLIC_SITE_URL — Canonical app URL for the redirect_uri
 *
 * The callback URL must be registered in Google Cloud Console as an
 * authorized redirect URI:
 *   https://your-site.com/api/connectors/youtube/oauth/callback
 *
 * AXIOM 4 — Security by Default: client_secret is never sent in this request.
 * ARCHITECTURE.md §3 — Auth flow lives in API routes, not the component layer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

// YouTube readonly scope — read subscriptions, history, and Watch Later
const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? '';
  if (!clientId) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID is not configured. Add it in Vercel environment variables.' },
      { status: 503 },
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : '';

  const origin = siteUrl || new URL(req.url).origin;
  const redirectUri = `${origin}/api/connectors/youtube/oauth/callback`;

  // PKCE: generate a random state value to prevent CSRF
  const state = crypto.randomUUID();

  // Store state in a short-lived secure cookie for CSRF validation
  const cookieStore = await cookies();
  cookieStore.set('yt_oauth_state', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   600, // 10 minutes
    path:     '/',
  });

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         YOUTUBE_SCOPE,
    access_type:   'offline',  // request refresh_token
    prompt:        'consent',  // always show consent screen to get refresh_token
    state,
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
