'use client'
import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/client'

type Widget = {
  id: string
  title: string
  body?: string
  url?: string
  type?: string
  position?: number
}

export default function WidgetGrid({ initial = [] as Widget[] }) {
  const [widgets, setWidgets] = useState<Widget[]>(initial)
  const supabase = createBrowserSupabase()

  useEffect(() => {
    setWidgets(initial)
  }, [initial])

  async function remove(id: string) {
    await supabase.from('widgets').delete().eq('id', id)
    setWidgets((prev)=>prev.filter(w=>w.id !== id))
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {widgets.map((w) => (
        <div key={w.id} className="glass p-4 rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{w.title}</h3>
              {w.body && <p className="text-sm text-slate-300 mt-1">{w.body}</p>}
            </div>
            <button onClick={()=>remove(w.id)} className="text-xs text-slate-300">Delete</button>
          </div>
          {w.url && (
            <div className="mt-3">
              {w.type === 'video' ? (
                <iframe className="w-full aspect-video rounded-xl" src={w.url} allowFullScreen />
              ) : w.type === 'music' ? (
                <iframe className="w-full h-20 rounded-xl" src={w.url} />
              ) : (
                <a href={w.url} className="text-brandA underline text-sm" target="_blank">Open link</a>
              )}
            </div>
          )}
        </div>
      ))}
      {widgets.length === 0 && (
        <p className="text-slate-300">Add your first widget to see it here.</p>
      )}
    </div>
  )
}
