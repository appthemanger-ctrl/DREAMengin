'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UploadcareFileUploader } from '../../../components/UploadcareFileUploader'

export default function UploadTrack() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm()

  const onSubmit = async (d) => {
    await supabase.from('tracks').insert({
      title: d.title, artist: d.artist,
      artwork_url: d.artwork_url || null,
      mp3_url: d.mp3_url || null
    })
    router.push('/music')
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl mb-6">Upload track</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-4">
        <input {...register('title', { required: true })} placeholder="Title" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <input {...register('artist', { required: true })} placeholder="Artist" className="w-full rounded-lg px-4 py-2 bg-white/10" />

        <label className="text-sm">Artwork</label>
        <UploadcareFileUploader onUpload={(url) => setValue('artwork_url', url)} />

        <label className="text-sm">MP3 file</label>
        <UploadcareFileUploader onUpload={(url) => setValue('mp3_url', url)} />

        <button disabled={isSubmitting} className="bg-brandB text-white px-4 py-2 rounded-lg">
          {isSubmitting ? 'Uploading…' : 'Save'}
        </button>
      </form>
    </main>
  )
}
