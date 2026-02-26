/**
 * lib/admin/lockout.ts
 *
 * Shared permanent-lockout state for admin API routes.
 *
 * ONE wrong admin password attempt locks ALL admin routes for the lifetime of
 * the server process.  Set ADMIN_LOCKOUT=1 in your environment variables for
 * persistence across cold starts / deployments.
 *
 * To reset: remove ADMIN_LOCKOUT from your env config AND redeploy.
 */

// Process-level flag — shared across all modules that import this file.
let adminLocked = false;

/** Returns true when admin access is permanently locked. */
export function isAdminLocked(): boolean {
  return adminLocked || process.env.ADMIN_LOCKOUT === '1';
}

/** Call once when an incorrect password is entered — locks forever. */
export function triggerAdminLockout(): void {
  adminLocked = true;
}

// ── Owner gate ───────────────────────────────────────────────────────────────
export const OWNER_EMAIL = 'Appthemanger@gmail.com';

/** Returns true only for the owner's email (case-insensitive). */
export function isOwner(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

// ── Blocked domains ──────────────────────────────────────────────────────────
// Add domains here to permanently reject all admin-API requests that originate
// from them.  theboogieman.ai is intentionally NOT blocked here — the owner
// needs to reach BoogieMan AI from that domain.  The one-strike password
// lockout (above) is the primary security gate.
const BLOCKED_DOMAINS: string[] = [];

/** Returns true if the request originates from a blocked domain. */
export function isDomainBlocked(req: Request): boolean {
  if (BLOCKED_DOMAINS.length === 0) return false;
  const headers = [
    req.headers.get('origin') ?? '',
    req.headers.get('referer') ?? '',
    req.headers.get('host') ?? '',
  ];
  return headers.some((h) =>
    BLOCKED_DOMAINS.some((d) => h.toLowerCase().includes(d))
  );
}
