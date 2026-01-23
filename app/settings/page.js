'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import AccentPicker from '../../components/AccentPicker'

export default function Settings() {
  const supabase = createClient()
  const router = useRouter()
  const [full_name, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [links_json, setLinks] = useState('[]')
  const [saving, setSaving] = useState(false)

  useEffect(()=>{
    async function load() {
      const { data } = await supabase.from('profiles').select('*').single()
      if (data) {
        setFullName(data.full_name || '')
        setUsername(data.username || '')
        setBio(data.bio || '')
        setLinks(JSON.stringify(data.links_json || [], null, 2))
      }
    }
    load()
  }, [])

  async function save(e){
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({
      full_name, username, bio, links_json: JSON.parse(links_json || '[]')
    }).eq('id', user?.id)
    setSaving(false)
    router.push(`/profile/${username}`)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl mb-6">Settings</h1>
      <form onSubmit={save} className="glass p-6 space-y-4">
        <input value={full_name} onChange={e=>setFullName(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Bio" className="w-full rounded-lg px-4 py-2 bg-white/10" rows={3} />
        <textarea value={links_json} onChange={e=>setLinks(e.target.value)} placeholder='[{"title":"GitHub","url":"https://github.com/you"}]' className="w-full rounded-lg px-4 py-2 bg-white/10 font-mono text-sm" rows={4} />
        <AccentPicker />
        <button disabled={saving} className="bg-brandA text-white px-4 py-2 rounded-lg">{saving ? 'Saving…' : 'Save'}</button>
      </form>
    </main>
  )
}
