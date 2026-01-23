'use client'
import DraggableModules from '@/components/DraggableModules'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function HomePage() {
  const [initial, setInitial] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('widgets')
        .select('*')
        .order('position', { ascending: true })
      if (!error && data) setInitial(data as any[])
      setLoaded(true)
    }
    load()
  }, [])

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Modules</h1>
        <div className="flex gap-2">
          <Link href="/home/add" className="bg-brandB px-3 py-2 rounded-lg text-sm">Add widget</Link>
          <Link href="/settings" className="bg-white/10 px-3 py-2 rounded-lg text-sm">Settings</Link>
        </div>
      </header>
      {loaded ? <DraggableModules initial={initial} /> : <p className="text-slate-300">Loading…</p>}
    </main>
  )
}
