'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UploadcareFileUploader } from '../../../../components/UploadcareFileUploader'

export default function NewProduct() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm()

  const onSubmit = async (d) => {
    await supabase.from('products').insert({
      title: d.title,
      description: d.description || null,
      price_int: Math.round(Number(d.price || 0) * 100),
      file_path: d.file_path || null,
      published: false,
    })
    router.push('/shop/me')
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl mb-6">New product</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-4">
        <input {...register('title', { required: true })} placeholder="Title" className="w-full rounded-lg px-4 py-2 bg-white/10" />
        <textarea {...register('description')} placeholder="Description" className="w-full rounded-lg px-4 py-2 bg-white/10" rows={3} />
        <input {...register('price')} placeholder="Price (USD)" type="number" step="0.01" className="w-full rounded-lg px-4 py-2 bg-white/10" />

        <label className="text-sm">Digital file</label>
        <UploadcareFileUploader onUpload={(url) => setValue('file_path', url)} />

        <button disabled={isSubmitting} className="bg-brandB text-white px-4 py-2 rounded-lg">
          {isSubmitting ? 'Creating…' : 'Create draft'}
        </button>
      </form>
    </main>
  )
}
