
'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AddWidget(){
  const router = useRouter()
  const supabase = createClient()
  const [url,setUrl]=useState('')
  const detect=(u:string)=> u.includes('youtube')||u.includes('youtu.be')?'video':u.includes('spotify.com/track')?'music':'link'

  async function onSubmit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const title = String(form.get('title')||'Untitled')
    const body = String(form.get('body')||'')
    const urlVal = String(form.get('url')||'')
    const type = detect(urlVal)
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    await supabase.from('widgets').insert({ title, body, url: urlVal, type, owner: user.id, position: 0 })
    router.push('/home')
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <form onSubmit={onSubmit} className="glass p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Add widget</h1>
        <input name="title" placeholder="Title" className="w-full rounded-2xl px-4 py-3 bg-white/10" required />
        <textarea name="body" placeholder="Body (optional)" className="w-full rounded-2xl px-4 py-3 bg-white/10" rows={3} />
        <input name="url" placeholder="URL (optional)" className="w-full rounded-2xl px-4 py-3 bg-white/10" value={url} onChange={e=>setUrl(e.target.value)} />
        {url?<div className="text-sm opacity-80">Detected: {detect(url)}</div>:null}
        <button className="btn-primary">Save</button>
      </form>
    </main>
  )
}
