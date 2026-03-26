/**
 * lib/dev-bypass.ts
 *
 * Dev-only auth bypass for local UI inspection (req #31–33, agent spec §16).
 *
 * SERVER-SIDE ONLY.  Neither function is safe to call from a client
 * component — both read server-only env vars that are never bundled into
 * the browser by Next.js.
 *
 * Both helpers are hard-blocked in production (NODE_ENV === 'production')
 * regardless of what env vars are set.  This ensures that even a
 * misconfigured Vercel deployment cannot accidentally enable the bypass.
 *
 * When DEV_BYPASS_AUTH=true (dev/test only, server-only):
 *  - User-facing page auth redirects are skipped so the full UI can be
 *    reviewed without a Supabase account (interface inspection mode).
 *  - Admin endpoints remain guarded unless DEV_ADMIN=true is ALSO set.
 *
 * When DEV_ADMIN=true (requires DEV_BYPASS_AUTH=true as well):
 *  - The admin panel becomes accessible without login in dev.
 *  - IDARi API endpoints remain password-protected regardless.
 *
 * Both vars are server-only (no NEXT_PUBLIC_ prefix) so they are never
 * inlined into the client bundle by Next.js/webpack, even if accidentally
 * set in a production environment.
 */

/** Hard-blocks bypass in production. Returns true only in dev/test. */
function isDevEnv(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Returns true when the dev auth bypass is active.
 * SERVER-SIDE ONLY — reads a server-only env var.
 * Always returns false in production regardless of env var values.
 */
export function isDevBypassActive(): boolean {
  return isDevEnv() && process.env.DEV_BYPASS_AUTH === 'true';
}

/**
 * Returns true when the dev admin bypass is active.
 * SERVER-SIDE ONLY — reads server-only env vars.
 * Requires BOTH DEV_BYPASS_AUTH=true AND DEV_ADMIN=true.
 * Always returns false in production regardless of env var values.
 */
export function isDevAdminBypassActive(): boolean {
  return (
    isDevEnv() &&
    process.env.DEV_BYPASS_AUTH === 'true' &&
    process.env.DEV_ADMIN === 'true'
  );
}
