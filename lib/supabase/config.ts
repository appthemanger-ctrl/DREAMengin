const CANONICAL_PROJECT_REF = "suaiqcynxospjijzdudc";
const CANONICAL_SUPABASE_URL = `https://${CANONICAL_PROJECT_REF}.${["supabase", "co"].join(".")}`;
const CANONICAL_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_5gYss6NWI2tvE6wDOsb8cw_rjVqrAe6";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || CANONICAL_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || CANONICAL_SUPABASE_PUBLISHABLE_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Supabase env not configured");
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const SUPABASE_CONFIG = {
  url: trimTrailingSlash(SUPABASE_URL),
  anonKey: SUPABASE_PUBLISHABLE_KEY,
  setupHint: "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are configured.",
  isConfigured: () => Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY),
} as const;

export function getServerSiteOrigin(requestOrigin?: string): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through
    }
  }

  if (requestOrigin) return new URL(requestOrigin).origin;
  return "http://localhost:3000";
}

export function buildAuthCallbackUrl(origin: string, nextPath?: string): string {
  const callback = new URL("/auth/callback", origin);
  if (nextPath) callback.searchParams.set("next", nextPath);
  return callback.toString();
}

export function getSupabaseAuthCallbackUrl(): string | null {
  if (!SUPABASE_CONFIG.url) return null;
  return new URL("/auth/v1/callback", `${SUPABASE_CONFIG.url}/`).toString();
}
