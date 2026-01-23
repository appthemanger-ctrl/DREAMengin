'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    if (error) setMsg(error.message)
    else setMsg('Check your email for the reset link.')
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="glass w-full max-w-sm p-6 space-y-3">
        <h1 className="font-display text-2xl">Reset password</h1>
        <input
          type="email"
          className="w-full rounded-lg px-4 py-2 bg-white/10"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <button disabled={loading} className="bg-brandA text-white rounded-lg px-4 py-2 w-full">
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
        {msg && <p className="text-sm text-slate-300">{msg}</p>}
        <button type="button" onClick={()=>router.push('/login')} className="text-xs text-slate-400">Back to login</button>
      </form>
    </main>
  )
}
