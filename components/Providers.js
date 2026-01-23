'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { Theme } from '../lib/theme'

export default function Providers({ children }) {
  const [supabase] = useState(() => createClientComponentClient())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    Theme.applyStored()
  }, [])

  if (!mounted) return null

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  )
}
