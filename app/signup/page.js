'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function Signup() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e){
    e.preventDefault()
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMsg(error.message)
    else router.push('/home')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="glass w-full max-w-sm p-8 space-y-4">
        <h1 className="font-display text-2xl">Create account</h1>
        <input className="w-full rounded-lg px-4 py-2 bg-white/10" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full rounded-lg px-4 py-2 bg-white/10" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button disabled={loading} className="w-full bg-brandA text-white rounded-lg py-2">{loading ? 'Working…' : 'Sign up'}</button>
        {msg && <p className="text-sm text-rose-400">{msg}</p>}
        <button type="button" onClick={()=>router.push('/login')} className="text-xs text-slate-400">I have an account</button>
      </form>
    </div>
  )
}
