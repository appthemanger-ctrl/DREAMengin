
'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'

type Inputs = { title:string; artist?:string; mp3?:FileList; artwork?:FileList }

export default function UploadTrack(){
  const supabase = createClient()
  const router = useRouter()
  const { register, handleSubmit, formState:{isSubmitting} } = useForm<Inputs>()
  const onSubmit = async (d:Inputs)=>{
    let mp3_url=''; if(d.mp3&&d.mp3[0]){ const path=`music/${Date.now()}-${d.mp3[0].name}`; const { data, error } = await supabase.storage.from('tracks').upload(path, d.mp3[0]); if(!error){ const pub = supabase.storage.from('tracks').getPublicUrl(data.path); mp3_url = pub.data.publicUrl } }
    let artwork_url=''; if(d.artwork&&d.artwork[0]){ const path=`art/${Date.now()}-${d.artwork[0].name}`; const { data, error } = await supabase.storage.from('tracks').upload(path, d.artwork[0]); if(!error){ const pub = supabase.storage.from('tracks').getPublicUrl(data.path); artwork_url = pub.data.publicUrl } }
    await supabase.from('tracks').insert({ title:d.title, artist:d.artist, mp3_url, artwork_url })
    router.push('/music')
  }
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Upload track</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-4">
        <input {...register('title',{required:true})} placeholder="Title" className="w-full rounded-2xl px-4 py-3 bg-white/10" />
        <input {...register('artist')} placeholder="Artist" className="w-full rounded-2xl px-4 py-3 bg-white/10" />
        <div><label className="text-sm">MP3</label><input type="file" accept="audio/mpeg" {...register('mp3')} className="mt-1 block" /></div>
        <div><label className="text-sm">Artwork</label><input type="file" accept="image/*" {...register('artwork')} className="mt-1 block" /></div>
        <button disabled={isSubmitting} className="btn-primary">{isSubmitting?'Uploading…':'Save'}</button>
      </form>
    </main>
  )
}
