'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function AddWidget() {
  const supabase = createClient()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState('text')
  const [saving, setSaving] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    await supabase.from('widgets').insert({
      title, body, url, type, owner: user.id, position: 0
    })
    router.push('/home')
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <form onSubmit={onSubmit} className="glass p-6 space-y-4">
        <h1 className="font-display text-2xl">Add widget</h1>
        <label className="block text-sm font-medium">Title</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full rounded-lg px-4 py-2 bg-white/10" required />
        <label className="block text-sm font-medium">Body (optional)</label>
        <textarea value={body} onChange={e=>setBody(e.target.value)} className="w-full rounded-lg px-4 py-2 bg-white/10" rows={3} />
        <label className="block text-sm font-medium">URL (optional)</label>
        <input value={url} onChange={e=>setUrl(e.target.value)} type="url" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <label className="block text-sm font-medium">Type</label>
        <select value={type} onChange={e=>setType(e.target.value)} className="w-full rounded-lg px-4 py-2 bg-white/10">
          <option value="text">Text</option>
          <option value="link">Link</option>
          <option value="promo">Promo</option>
        </select>
        <button disabled={saving} className="bg-brandA text-white px-4 py-2 rounded-lg">{saving ? 'Saving…' : 'Save'}</button>
      </form>
    </main>
  )
}
