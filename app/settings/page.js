'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Theme } from '../../lib/theme'

export default function Settings() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (data) {
        reset({
          full_name: data.full_name || '',
          username: data.username || '',
          bio: data.bio || '',
          links_json: JSON.stringify(data.links_json || [], null, 2),
          accent_color: data.accent_color || '#0ea5e9',
        })
      }
    }
    load()
  }, [])

  const onSubmit = async (d) => {
    const parsedLinks = (() => { try { return JSON.parse(d.links_json || '[]') } catch { return [] } })()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('profiles').update({
      full_name: d.full_name,
      username: d.username,
      bio: d.bio,
      links_json: parsedLinks,
      accent_color: d.accent_color,
    }).eq('id', session.user.id)
    router.push(`/profile/${d.username}`)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl mb-6">Settings</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-4">
        <input {...register('full_name')} placeholder="Full name" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <input {...register('username')} placeholder="Username" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <textarea {...register('bio')} placeholder="Bio" className="w-full rounded-lg px-4 py-2 bg-white/10" rows={3} />
        <textarea
          {...register('links_json')}
          placeholder='[{"title":"GitHub","url":"https://github.com/you"}]'
          className="w-full rounded-lg px-4 py-2 bg-white/10 font-mono text-sm"
          rows={4}
        />
        <div className="flex items-center gap-4">
          <label className="text-sm">Accent color</label>
          <input type="color" {...register('accent_color')} className="w-16 h-8 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-brandA text-white px-4 py-2 rounded-lg">Save</button>
          <button type="button" onClick={Theme.toggle} className="text-sm text-slate-300">Toggle dark/light</button>
        </div>
      </form>
    </main>
  )
}
