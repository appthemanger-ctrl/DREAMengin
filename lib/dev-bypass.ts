/**
 * lib/dev-bypass.ts
 *
 * Dev-only auth bypass for UI inspection (req #31–33, agent spec §16).
 *
 * When NEXT_PUBLIC_DEV_BYPASS_AUTH=true:
 *  - User-facing page auth redirects are skipped so the full UI can be
 *    reviewed without a Supabase account (interface inspection mode).
 *  - Admin endpoints remain guarded unless DEV_ADMIN=true is ALSO set.
 *
 * When DEV_ADMIN=true (requires NEXT_PUBLIC_DEV_BYPASS_AUTH=true as well):
 *  - The admin panel becomes accessible without login in dev.
 *  - IDARi API endpoints remain password-protected regardless.
 *
 * NEVER enable either flag in production.  Both are explicitly excluded
 * from .env.example production values and are not exposed as Vercel
 * production env vars.
 */

/**
 * Returns true when the dev auth bypass is active.
 * Safe to call in both server and client contexts (uses NEXT_PUBLIC_ prefix).
 */
export function isDevBypassActive(): boolean {
  return process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';
}

/**
 * Returns true when the dev admin bypass is active.
 * Requires BOTH NEXT_PUBLIC_DEV_BYPASS_AUTH=true AND DEV_ADMIN=true.
 * Server-side only — DEV_ADMIN is intentionally not NEXT_PUBLIC_ so it
 * is never shipped to the client bundle.
 */
export function isDevAdminBypassActive(): boolean {
  return (
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true' &&
    process.env.DEV_ADMIN === 'true'
  );
}
