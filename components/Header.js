'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Theme } from '../lib/theme'

export default function Header() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="flex items-center justify-between mb-8">
      <Link href="/home" className="font-display text-2xl text-white">DREAMengin</Link>
      <nav className="flex items-center gap-4 text-sm text-slate-300">
        <Link href="/profile/me">Profile</Link>
        <Link href="/music">Music</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/connectors">Connectors</Link>
        <Link href="/settings">Settings</Link>
        <button onClick={Theme.toggle}>Theme</button>
        <button onClick={logout}>Logout</button>
      </nav>
    </header>
  )
}
