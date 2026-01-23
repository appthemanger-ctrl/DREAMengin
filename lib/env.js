export function validateEnv() {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
  const missing = required.filter((k) => !process.env[k])
  if (missing.length > 0) {
    console.warn(`[env] Missing env vars: ${missing.join(', ')}`)
    return false
  }
  return true
}
