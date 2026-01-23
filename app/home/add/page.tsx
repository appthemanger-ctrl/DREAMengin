'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase'

export default function AddWidget() {
  const [url, setUrl] = useState('')
  const router = useRouter()
  const supabase = supabaseBrowser()

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const title = String(form.get('title') || 'Untitled')
    const body = String(form.get('body') || '')
    const link = String(form.get('url') || '')
    const type = link.includes('youtube') ? 'video' : link.includes('spotify') ? 'music' : 'link'

    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('widgets').insert([{ title, body, url: link, type, owner: user?.id, position: 0 }])
    router.push('/home')
    router.refresh()
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="glass p-6">
        <h1 className="text-3xl font-extrabold mb-4">🎉 Add Anything You Love</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input name="title" placeholder="My Favorite Song" className="w-full p-3 rounded-2xl bg-white/10" required />
          <input name="body" placeholder="Why I love it..." className="w-full p-3 rounded-2xl bg-white/10" />
          <input
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste any link (YouTube, Spotify, website)..."
            className="w-full p-3 rounded-2xl bg-white/10"
          />
          {url && (
            <div className="p-3 rounded-2xl bg-green-500/20">
              Detected: {url.includes('youtube') ? '📹 Video' : url.includes('spotify') ? '🎵 Music' : '🔗 Link'}
            </div>
          )}
          <button type="submit" className="btn-primary w-full">Create Widget</button>
        </form>
      </div>
    </main>
  )
}
