
'use client'
import { useRouter } from 'next/navigation'
import { Theme } from '@/lib/theme'
import { createClient } from '@/lib/supabase/client'
export default function Header(){
  const router = useRouter()
  const supabase = createClient()
  return (
    <header className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-bold">DREAMengin</h1>
      <div className="flex items-center gap-3">
        <button onClick={()=>Theme.toggle()} className="text-sm opacity-80 hover:opacity-100">Swap colors</button>
        <button onClick={async()=>{ await supabase.auth.signOut(); router.push('/login') }} className="text-sm opacity-80 hover:opacity-100">Logout</button>
      </div>
    </header>
  )
}
