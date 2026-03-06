/**
 * lib/supabase/env.ts
 *
 * Single source of truth for Supabase env-var resolution.
 *
 * Accepts every naming convention the Vercel-Supabase integration injects,
 * plus the project's own custom names.  First truthy value wins.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * WHAT THE VERCEL-SUPABASE INTEGRATION ACTUALLY INJECTS
 * (confirmed from user's Vercel env-var list 2026-03-05)
 *
 *  Standard names  (NEXT_PUBLIC_ = safe on client + server)
 *    NEXT_PUBLIC_SUPABASE_URL
 *    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   ← new standard (2024-Q4)
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY          ← legacy standard
 *
 *  Project-prefixed NEXT_PUBLIC
 *    NEXT_PUBLIC_dreamengin_SUPABASE_PUBLISHABLE_KEY
 *
 *  Project-prefixed server-only  (no NEXT_PUBLIC_ = server only)
 *    dreamengin_SUPABASE_URL
 *    dreamengin_SUPABASE_ANON_KEY
 *    dreamengin_SUPABASE_JWT_SECRET
 *    dreamengin_SUPABASE_SECRET_KEY
 *    dreamengin_SUPABASE_SERVICE_ROLE_KEY
 *    dreamengin_POSTGRES_*  (direct-connection strings – not used here)
 *
 *  Manually added by user
 *    NEXT_PUBLIC_dreamengin_SUPABASE_URL       (legacy app name)
 *    NEXT_PUBLIC_dreamengin_SUPABASE_ANON_KEY  (legacy app name)
 *
 * ──────────────────────────────────────────────────────────────────────────
 * IMPORTANT: Each env var must be accessed via a LITERAL member expression
 * (process.env.NEXT_PUBLIC_FOO) so that Next.js/webpack DefinePlugin can
 * inline NEXT_PUBLIC_* values at build time.  Dynamic bracket access such as
 * process.env[variable] is not statically analyzable and always returns
 * undefined in the browser bundle, even when the variable is set.
 */

// ── URL ───────────────────────────────────────────────────────────────────────

export const SUPABASE_URL =
  // Manually added / legacy custom name
  process.env.NEXT_PUBLIC_dreamengin_SUPABASE_URL ||
  // Standard Vercel-Supabase integration (NEXT_PUBLIC – client + server)
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  // Project-prefixed server-only alias (server only – undefined in browser)
  process.env.dreamengin_SUPABASE_URL ||
  '';

// ── Anon / publishable key ────────────────────────────────────────────────────

export const SUPABASE_ANON_KEY =
  // Manually added / legacy custom NEXT_PUBLIC names
  process.env.NEXT_PUBLIC_dreamengin_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_dreamengin_SUPABASE_PUBLISHABLE_KEY ||
  // Standard Vercel-Supabase integration (NEXT_PUBLIC – client + server)
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  // Project-prefixed server-only aliases (server only – undefined in browser)
  process.env.dreamengin_SUPABASE_ANON_KEY ||
  process.env.dreamengin_SUPABASE_PUBLISHABLE_KEY ||
  '';

// ── Service-role key  (server-only) ──────────────────────────────────────────

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.dreamengin_SUPABASE_SECRET_KEY ||
  process.env.dreamengin_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

// ── JWT secret  (server-only) ─────────────────────────────────────────────────

export const SUPABASE_JWT_SECRET =
  process.env.dreamengin_SUPABASE_JWT_SECRET ||
  process.env.SUPABASE_JWT_SECRET ||
  '';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Human-readable setup hint for error messages and /api/setup/check.
 * Lists the exact names from the user's Vercel project.
 */
export const SETUP_HINT =
  'Ensure these environment variables are set in ' +
  'Vercel → Project → Settings → Environment Variables:\n' +
  '  URL  →  NEXT_PUBLIC_SUPABASE_URL  (already set by Vercel-Supabase integration)\n' +
  '  KEY  →  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  or  NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
  'The app also accepts the project-prefixed variants:\n' +
  '  NEXT_PUBLIC_dreamengin_SUPABASE_URL / NEXT_PUBLIC_dreamengin_SUPABASE_ANON_KEY';
