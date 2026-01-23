'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AddWidget() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { register, handleSubmit } = useForm()

  const onSubmit = async (data) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('widgets').insert({
      title: data.title,
      body: data.body || null,
      url: data.url || null,
      type: 'text',
      owner: session.user.id,
      position: 0,
    })
    router.push('/home')
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-4">
        <h1 className="font-display text-2xl">Add widget</h1>
        <input {...register('title', { required: true })} placeholder="Title" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <textarea {...register('body')} placeholder="Body (optional)" className="w-full rounded-lg px-4 py-2 bg-white/10" rows={3} />
        <input {...register('url')} placeholder="URL (optional)" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <button className="bg-brandA text-white px-4 py-2 rounded-lg">Save</button>
      </form>
    </main>
  )
}
