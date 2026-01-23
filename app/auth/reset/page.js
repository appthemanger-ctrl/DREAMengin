'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function ResetPage() {
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function update(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setMsg(error.message)
    else {
      setMsg('Password updated.')
      router.push('/login')
    }
    setLoading(false)
  }

  useEffect(()=>{
    // no-op; Supabase sets the session via URL hash automatically
  }, [])

  return (
    <div style={{minHeight:'80vh',display:'grid',placeItems:'center'}}>
      <form onSubmit={update} className="glass p-6" style={{minWidth:320}}>
        <h1 className="font-display text-2xl mb-3">Choose a new password</h1>
        <input
          type="password"
          className="w-full rounded-lg px-4 py-2 bg-white/10"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          placeholder="New password"
          minLength={8}
          required
        />
        <button disabled={loading} className="bg-brandA text-white rounded-lg px-4 py-2 w-full mt-3">
          {loading ? 'Updating…' : 'Update password'}
        </button>
        {msg && <p className="text-sm text-slate-300 mt-2">{msg}</p>}
      </form>
    </div>
  )
}
