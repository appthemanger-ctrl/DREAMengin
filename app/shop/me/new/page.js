'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { UploadcareFileUploader } from '../../../../components/UploadcareFileUploader'

export default function NewProduct() {
  const supabase = createClient()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [file_path, setFilePath] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e){
    e.preventDefault()
    setSaving(true)
    await supabase.from('products').insert({
      title, description, price_int: Math.round(Number(price)*100), file_path, published: false
    })
    setSaving(false)
    router.push('/shop/me')
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl mb-6">New product</h1>
      <form onSubmit={submit} className="glass p-6 space-y-4">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="w-full rounded-lg px-4 py-2 bg-white/10" required />
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="w-full rounded-lg px-4 py-2 bg-white/10" rows={3} />
        <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price (USD)" type="number" step="0.01" className="w-full rounded-lg px-4 py-2 bg-white/10" required />
        <label className="text-sm">Digital file</label>
        <UploadcareFileUploader onUpload={(url)=>setFilePath(url)} />
        <button disabled={saving} className="bg-brandB text-white px-4 py-2 rounded-lg">{saving ? 'Creating…' : 'Create draft'}</button>
      </form>
    </main>
  )
}
