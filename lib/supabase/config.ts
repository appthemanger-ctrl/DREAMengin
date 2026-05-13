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
