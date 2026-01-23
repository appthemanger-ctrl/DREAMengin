'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState('login')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setMsg('')
    let error
    if (view === 'login') {
      ;({ error } = await supabase.auth.signInWithPassword({ email, password }))
    } else {
      ;({ error } = await supabase.auth.signUp({ email, password }))
    }
    if (error) setMsg(error.message)
    else router.push('/home')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="glass w-full max-w-sm mx-auto p-8 space-y-4">
        <h1 className="font-display text-2xl">{view === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <input
          className="w-full rounded-lg px-4 py-2 bg-white/10 placeholder-slate-300"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg px-4 py-2 bg-white/10 placeholder-slate-300"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button disabled={loading} className="w-full bg-brandA text-white rounded-lg py-2">{loading ? 'Working…' : (view === 'login' ? 'Login' : 'Sign up')}</button>
        {msg && <p className="text-sm text-rose-400">{msg}</p>}
        <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-sm text-slate-300">
          {view === 'login' ? 'Need an account?' : 'Already have one?'}
        </button>
      </form>
    </div>
  )
}
