
export function validateEnv(){
  const req = ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY']
  const miss = req.filter(k=>!process.env[k])
  if (miss.length) console.warn('Missing env vars: ' + miss.join(', '))
  return miss.length===0
}
