
import { createServerSupabase } from '@/lib/supabase/server'
import Link from 'next/link'
export default async function Shop(){
  const supabase = createServerSupabase()
  const { data } = await supabase.from('products').select('*').eq('published', true).order('created_at', { ascending: false })
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Shop</h1>
        <Link href="/shop/me" className="btn-primary">Creator dashboard</Link>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {(data||[]).map((p:any)=>(
          <div key={p.id} className="glass p-4">
            <h3 className="font-semibold">{p.title}</h3>
            {p.description?<p className="text-sm opacity-80 mt-1">{p.description}</p>:null}
            <p className="mt-3 text-lg">${(p.price_int/100).toFixed(2)}</p>
            <form action={`/shop/buy/${p.id}`} method="POST"><button className="btn-primary mt-3 text-sm">Buy</button></form>
          </div>
        ))}
      </div>
    </main>
  )
}
