import * as supabaseEnv from '@/lib/supabase/env';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export const SUPABASE_CONFIG = {
  url: trimTrailingSlash(supabaseEnv.SUPABASE_URL),
  anonKey: supabaseEnv.SUPABASE_ANON_KEY,
  setupHint: 'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are configured.',
  isConfigured: () => Boolean(supabaseEnv.SUPABASE_URL && supabaseEnv.SUPABASE_ANON_KEY),
} as const;

export function getServerSiteOrigin(requestOrigin?: string): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through
    }
  }

  if (requestOrigin) return new URL(requestOrigin).origin;
  return 'http://localhost:3000';
}

export function buildAuthCallbackUrl(origin: string, nextPath?: string): string {
  const callback = new URL('/auth/callback', origin);
  if (nextPath) callback.searchParams.set('next', nextPath);
  return callback.toString();
}

export function getSupabaseAuthCallbackUrl(): string | null {
  if (!SUPABASE_CONFIG.url) return null;
  return new URL('/auth/v1/callback', `${SUPABASE_CONFIG.url}/`).toString();
}
