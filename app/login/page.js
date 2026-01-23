'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState('login')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const { error } =
      view === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else router.push('/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="glass w-full max-w-sm mx-auto p-8 space-y-4">
        <h1 className="font-display text-2xl">{view === 'login' ? 'Welcome back' : 'Create account'}</h1>
        {error && <p className="text-rose-400 text-sm">{error}</p>}
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
        <button className="w-full bg-brandA text-white rounded-lg py-2">{view === 'login' ? 'Login' : 'Sign up'}</button>
        <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-sm text-slate-300">
          {view === 'login' ? 'Need an account?' : 'Already have one?'}
        </button>
        <p className="text-xs text-slate-400">
          Or continue to <Link href="/" className="underline">landing</Link>
        </p>
      </form>
    </div>
  )
}
