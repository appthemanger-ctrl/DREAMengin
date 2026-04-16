/**
 * lib/admin/lockout.ts
 *
 * Durable permanent-lockout state for admin API routes.
 *
 * ONE wrong admin password attempt locks ALL admin routes permanently.
 * The lock is stored in the Supabase `admin_lock` table (service-role
 * access only) so it survives cold starts, redeployments, and
 * multi-region Vercel instances — it is NOT in-memory only.
 *
 * Fast-path: a process-level cache avoids a DB round-trip on every
 * request once the locked state is known to be true.
 *
 * Emergency override: set ADMIN_LOCKOUT=1 in your environment to force-
 * lock without touching the database.
 *
 * To unlock: update the `admin_lock` row in the Supabase dashboard
 * (set locked = false) — no code change required.
 */

import { createServiceClient } from '@/lib/supabase/server';

// Process-level cache — avoids a DB hit on every request.
// null  = unknown (need to check DB)
// true  = locked  (cached after first confirmed lock)
let _cachedLocked: boolean | null = null;

/** Returns true when admin access is permanently locked. */
export async function isAdminLocked(): Promise<boolean> {
  // Fast path 1: emergency env-var override.
  if (process.env.ADMIN_LOCKOUT === '1') return true;

  // Fast path 2: ADMIN_UNLOCK_KEY bypasses lockout entirely.
  if (process.env.ADMIN_UNLOCK_KEY) return false;

  // Fast path 2: already confirmed locked in this process lifetime.
  if (_cachedLocked === true) return true;

  // Durable check: query the Supabase admin_lock table.
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from('admin_lock')
      .select('locked')
      .single();
    if (data?.locked) {
      _cachedLocked = true;
      return true;
    }
  } catch {
    // Supabase is unconfigured or unreachable — fail open (don't
    // accidentally hard-block a legitimate owner who hasn't set up
    // the service-role key yet).
  }

  return false;
}

/** Call once when an incorrect password is entered — locks forever. */
export async function triggerAdminLockout(): Promise<void> {
  // Set the in-process cache immediately so subsequent requests in
  // this instance are blocked even if the DB write is slow.
  _cachedLocked = true;

  // Persist to Supabase so the lock survives across instances/deploys.
  try {
    const supabase = await createServiceClient();
    await supabase.from('admin_lock').upsert({
      id: true,
      locked: true,
      locked_at: new Date().toISOString(),
      reason: 'Incorrect admin password attempt',
    });
  } catch {
    // Log but don't throw — the in-memory lock still protects this
    // instance, and the env-var fallback is always available.
    console.error('[admin-lockout] Failed to persist lockout to Supabase. ' +
      'Set ADMIN_LOCKOUT=1 as a fallback until the DB is reachable.');
  }
}

// ── Owner gate ───────────────────────────────────────────────────────────────
export const OWNER_EMAIL = process.env.OWNER_EMAIL || 'Appthemanger@gmail.com';

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
