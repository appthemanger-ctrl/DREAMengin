/**
 * lib/env/supabase.ts — Fallback resolver for Supabase/Postgres env vars.
 *
 * Vercel/Supabase may install env vars under a resource-prefixed name
 * (e.g. dreamengin_SUPABASE_URL) rather than the canonical name.
 * These helpers resolve either form so the rest of the app can use a
 * single import regardless of which set is present.
 */

export function getSupabasePublicEnv() {
  // MUST exist for browser/client code
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (client needs these exact names)'
    );
  }
  return { url, anonKey };
}

export function getSupabaseServiceRoleKey(): string {
  // server-only; allow either canonical or namespaced
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.dreamengin_SUPABASE_SERVICE_ROLE_KEY;

  if (!key)
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY (or dreamengin_SUPABASE_SERVICE_ROLE_KEY)'
    );
  return key;
}

export function getPostgresUrl(): string {
  // server-only; allow either canonical or namespaced
  const url =
    process.env.POSTGRES_URL ??
    process.env.dreamengin_POSTGRES_URL;

  if (!url)
    throw new Error('Missing POSTGRES_URL (or dreamengin_POSTGRES_URL)');
  return url;
}
