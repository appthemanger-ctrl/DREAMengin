'use client'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { Theme } from '@/lib/theme'
import Link from 'next/link'

export default function Header() {
  const router = useRouter()
  const supabase = createBrowserSupabase()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="flex items-center justify-between mb-8">
      <Link href="/home" className="font-display text-2xl">DREAMengin</Link>
      <div className="flex items-center gap-4">
        <Link href="/home/add" className="text-sm text-slate-200">Add</Link>
        <button onClick={Theme.toggle} className="text-sm text-slate-300">
          Theme
        </button>
        <button onClick={logout} className="text-sm text-slate-300">
          Logout
        </button>
      </div>
    </header>
  )
}
