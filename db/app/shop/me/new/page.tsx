
'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
type Inputs = { title:string; description?:string; price:number; file_path?:string }
export default function NewProduct(){
  const supabase = createClient()
  const router = useRouter()
  const { register, handleSubmit, formState:{isSubmitting} } = useForm<Inputs>()
  const onSubmit = async (d:Inputs)=>{
    await supabase.from('products').insert({
      title:d.title, description:d.description||'', price_int:Math.round((d.price||0)*100), file_path:d.file_path||'', published:false
    }); router.push('/shop/me')
  }
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">New product</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 space-y-4">
        <input {...register('title',{required:true})} placeholder="Title" className="w-full rounded-2xl px-4 py-3 bg-white/10" />
        <textarea {...register('description')} placeholder="Description" className="w-full rounded-2xl px-4 py-3 bg-white/10" rows={3} />
        <input type="number" step="0.01" {...register('price',{valueAsNumber:true})} placeholder="Price (USD)" className="w-full rounded-2xl px-4 py-3 bg-white/10" />
        <button disabled={isSubmitting} className="btn-primary">{isSubmitting?'Saving…':'Create draft'}</button>
      </form>
    </main>
  )
}
