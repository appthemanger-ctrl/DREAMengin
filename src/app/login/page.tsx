'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form action="/api/auth/magic" method="POST" className="glass w-full max-w-sm p-8 space-y-4 rounded-3xl">
        <h1 className="font-display text-2xl">Welcome</h1>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full rounded-xl px-4 py-3 bg-white/10 placeholder-slate-300"
          required
        />
        <button className="btn-primary w-full">Send magic link ✨</button>
        <p className="text-xs text-slate-300">Or use password login in Settings later.</p>
      </form>
    </main>
  )
}
