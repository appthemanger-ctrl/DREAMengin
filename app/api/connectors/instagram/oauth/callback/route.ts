/**
 * app/api/connectors/instagram/oauth/callback/route.ts
 *
 * GET /api/connectors/instagram/oauth/callback
 *
 * Instagram Basic Display API OAuth 2.0 callback.
 *
 * 1. Validates the `state` parameter against the CSRF cookie.
 * 2. Exchanges the short-lived authorization `code` for a short-lived token.
 * 3. Exchanges the short-lived token for a long-lived token (60-day TTL).
 * 4. Upserts the long-lived token into `connector_accounts.token_blob`.
 * 5. Redirects back to the connectors page.
 *
 * Required env vars:
 *   INSTAGRAM_CLIENT_ID      — App ID from Meta for Developers
 *   INSTAGRAM_CLIENT_SECRET  — App Secret (server-only)
 *   NEXT_PUBLIC_SITE_URL     — Canonical app URL
 *
 * AXIOM 4 — Security by Default: token never returned to the browser.
 * ARCHITECTURE.md §3 — All OAuth token exchange is server-side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';

const IG_TOKEN_URL      = 'https://api.instagram.com/oauth/access_token';
const IG_LONG_TOKEN_URL = 'https://graph.instagram.com/access_token';

interface IGShortTokenResponse {
  access_token?: string;
  user_id?:      number;
  error_type?:   string;
  error_message?: string;
}

interface IGLongTokenResponse {
  access_token?: string;
  token_type?:   string;
  expires_in?:   number;
  error?:        { message: string; type: string; code: number };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url   = new URL(req.url);
  const code  = url.searchParams.get('code')  ?? '';
  const state = url.searchParams.get('state') ?? '';
  const error = url.searchParams.get('error') ?? '';

  const origin = url.origin;
  const connectorsUrl = `${origin}/connectors`;

  // ── Handle provider-side errors ──────────────────────────────────────────
  if (error) {
    const dest = new URL(connectorsUrl);
    dest.searchParams.set('ig_error', error);
    return NextResponse.redirect(dest);
  }

  // ── CSRF state check ────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const storedState = cookieStore.get('ig_oauth_state')?.value ?? '';
  cookieStore.delete('ig_oauth_state');

  if (!storedState || storedState !== state) {
    const dest = new URL(connectorsUrl);
    dest.searchParams.set('ig_error', 'state_mismatch');
    return NextResponse.redirect(dest);
  }

  // ── Auth check ───────────────────────────────────────────────────────────
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?next=/connectors`);
  }

  const clientId     = process.env.INSTAGRAM_CLIENT_ID     ?? '';
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET ?? '';
  const siteUrl      = process.env.NEXT_PUBLIC_SITE_URL    ?? '';
  const callbackOrigin = siteUrl || origin;
  const redirectUri  = `${callbackOrigin}/api/connectors/instagram/oauth/callback`;

  if (!clientId || !clientSecret) {
    const dest = new URL(connectorsUrl);
    dest.searchParams.set('ig_error', 'not_configured');
    return NextResponse.redirect(dest);
  }

  // ── Step 1: Exchange code for short-lived token ──────────────────────────
  let shortToken: string;
  try {
    const body = new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      grant_type:    'authorization_code',
      redirect_uri:  redirectUri,
      code,
    });
    const res = await fetch(IG_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });
    const data = await res.json() as IGShortTokenResponse;
    if (!data.access_token) {
      throw new Error(data.error_message ?? 'No access_token in response');
    }
    shortToken = data.access_token;
  } catch (err) {
    const dest = new URL(connectorsUrl);
    dest.searchParams.set('ig_error', 'short_token_failed');
    return NextResponse.redirect(dest);
  }

  // ── Step 2: Exchange short-lived for long-lived token (60 days) ──────────
  let longToken: string;
  let expiresIn = 5184000; // 60 days default
  try {
    const params = new URLSearchParams({
      grant_type:    'ig_exchange_token',
      client_secret: clientSecret,
      access_token:  shortToken,
    });
    const res = await fetch(`${IG_LONG_TOKEN_URL}?${params.toString()}`);
    const data = await res.json() as IGLongTokenResponse;
    if (!data.access_token) {
      throw new Error(data.error?.message ?? 'No long-lived token in response');
    }
    longToken = data.access_token;
    if (data.expires_in) expiresIn = data.expires_in;
  } catch {
    // If long-lived exchange fails, fall back to short-lived token
    longToken = shortToken;
  }

  // ── Store token in connector_accounts ────────────────────────────────────
   
  const db = supabase as any;
  const now = new Date().toISOString();

  const tokenBlob = {
    access_token: longToken,
    expires_at:   String(Date.now() + expiresIn * 1000),
  };

  const { error: dbError } = await db
    .from('connector_accounts')
    .upsert(
      {
        user_id:          user.id,
        provider:         'instagram',
        status:           'connected',
        token_blob:       tokenBlob,
        last_verified_at: now,
        last_error:       null,
        updated_at:       now,
      },
      { onConflict: 'user_id,provider' },
    );

  if (dbError) {
    const dest = new URL(connectorsUrl);
    dest.searchParams.set('ig_error', 'db_error');
    return NextResponse.redirect(dest);
  }

  // ── Success ───────────────────────────────────────────────────────────────
  const dest = new URL(connectorsUrl);
  dest.searchParams.set('ig_connected', '1');
  return NextResponse.redirect(dest);
}
