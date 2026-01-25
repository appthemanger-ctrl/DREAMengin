
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
export default function ShopMe(){
  const [products,setProducts]=useState<any[]>([])
  const supabase = createClient()
  useEffect(()=>{ supabase.from('products').select('*').order('created_at',{ascending:false}).then(({data})=>setProducts(data||[])) },[])
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My products</h1>
        <Link href="/shop/me/new" className="btn-primary">New product</Link>
      </div>
      <div className="grid gap-4">
        {products.map(p=>(
          <div key={p.id} className="glass p-4 flex items-center justify-between">
            <div><h3 className="font-semibold">{p.title}</h3><p className="text-sm opacity-80">${(p.price_int/100).toFixed(2)} · {p.published?'Published':'Draft'}</p></div>
            <Link href={`/shop/me/edit/${p.id}`} className="text-sm underline">Edit</Link>
          </div>
        ))}
      </div>
    </main>
  )
}
