
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Login(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [mode,setMode]=useState<'login'|'signup'|'magic'>('login')
  const router = useRouter()
  const supabase = createClient()

  async function onSubmit(e:React.FormEvent){
    e.preventDefault()
    if (mode==='magic'){
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (!error) alert('Magic link sent — check your email'); else alert(error.message); return
    }
    if (mode==='signup'){
      const { error } = await supabase.auth.signUp({ email, password })
      if (!error) router.push('/home'); else alert(error.message); return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) router.push('/home'); else alert(error.message)
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="glass p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-center">Welcome</h1>
        <input className="w-full rounded-2xl px-4 py-3 bg-white/10" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        {mode!=='magic' && (<input className="w-full rounded-2xl px-4 py-3 bg-white/10" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />)}
        <button className="btn-primary w-full">{mode==='login'?'Login':mode==='signup'?'Create account':'Send magic link'}</button>
        <div className="flex justify-between text-sm opacity-80">
          <button type="button" onClick={()=>setMode(mode==='login'?'signup':'login')}>{mode==='login'?'Need an account?':'Have an account?'}</button>
          <button type="button" onClick={()=>setMode('magic')}>Use magic link</button>
        </div>
      </form>
    </main>
  )
}
