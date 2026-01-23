'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import Link from 'next/link'

export default function ShopMe() {
  const [products, setProducts] = useState([])
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setProducts(data || []))
  }, [])

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">My products</h1>
        <Link href="/shop/me/new" className="bg-brandB px-4 py-2 rounded-lg text-sm">
          New product
        </Link>
      </div>

      <div className="grid gap-4">
        {products.map((p) => (
          <div key={p.id} className="glass p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-slate-300">${(p.price_int / 100).toFixed(2)} · {p.published ? 'Published' : 'Draft'}</p>
            </div>
            <Link href={`/shop/me/edit/${p.id}`} className="text-sm text-brandA">
              Edit
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}
