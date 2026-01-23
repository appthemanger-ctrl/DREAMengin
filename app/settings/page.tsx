
'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AccentPicker from '@/components/AccentPicker'

type Inputs = { full_name:string; username:string; bio:string; links_json:string; accent_color:string }

export default function Settings(){
  const { register, handleSubmit, reset, setValue } = useForm<Inputs>()
  const router = useRouter()
  const supabase = createClient()

  useEffect(()=>{ (async()=>{
    const { data:{ session } } = await supabase.auth.getSession()
    if (!session) return router.push('/login')
    const { data } = await supabase.from('profiles').select('*').single()
    if (data){
      reset({
        full_name: data.full_name||'',
        username: data.username||'',
        bio: data.bio||'',
        links_json: JSON.stringify(data.links_json||[], null, 2),
        accent_color: data.accent_color || '#0ea5e9'
      })
    }
  })() },[])

  const onSubmit = async (d:Inputs)=>{
    await supabase.from('profiles').update({
      full_name:d.full_name, username:d.username, bio:d.bio,
      links_json: JSON.parse(d.links_json||'[]'), accent_color:d.accent_color
    })
    router.push(`/profile/${d.username}`)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-4">
        <input {...register('full_name')} placeholder="Full name" className="w-full rounded-2xl px-4 py-3 bg-white/10" />
        <input {...register('username')} placeholder="Username" className="w-full rounded-2xl px-4 py-3 bg-white/10" />
        <textarea {...register('bio')} placeholder="Bio" className="w-full rounded-2xl px-4 py-3 bg-white/10" rows={3} />
        <textarea {...register('links_json')} className="w-full rounded-2xl px-4 py-3 bg-white/10 font-mono text-sm" rows={4} />
        <div className="flex items-center gap-3">
          <label className="text-sm">Accent</label>
          <AccentPicker value="#0ea5e9" onChange={(c)=>setValue('accent_color', c)} />
        </div>
        <button className="btn-primary">Save</button>
      </form>
    </main>
  )
}
