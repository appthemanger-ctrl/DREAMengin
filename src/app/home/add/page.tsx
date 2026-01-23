'use client'
import { useState } from 'react'
import { detectWidgetType } from '@/lib/widget-detector'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AddWidgetPage() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const router = useRouter()
  const supabase = createBrowserSupabase()

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    const t = detectWidgetType(url)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await supabase.from('widgets').insert({
      title: title || t.type.toUpperCase(),
      body,
      url: t.embed,
      type: t.type,
      owner: user.id,
      position: 0
    })
    router.push('/home')
  }

  const preview = url ? detectWidgetType(url) : null

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl mb-4">Add Anything</h1>
      <form onSubmit={onCreate} className="glass p-6 space-y-3">
        <input
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full rounded-xl px-4 py-2 bg-white/10"
        />
        <textarea
          value={body}
          onChange={e=>setBody(e.target.value)}
          placeholder="Body (optional)"
          className="w-full rounded-xl px-4 py-2 bg-white/10"
          rows={3}
        />
        <input
          value={url}
          onChange={e=>setUrl(e.target.value)}
          placeholder="Paste a link (YouTube, Spotify, X, …)"
          className="w-full rounded-xl px-4 py-2 bg-white/10"
          required
        />
        {preview && (
          <div className="glass p-4 rounded-xl text-sm">
            Preview type: <b>{preview.type}</b>
          </div>
        )}
        <button className="btn-primary">Create Widget 🎉</button>
      </form>
    </main>
  )
}
