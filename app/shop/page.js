import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function Shop() {
  const supabase = createServerComponentClient({ cookies })
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Shop</h1>
        <a href="/shop/me" className="bg-brandB px-4 py-2 rounded-lg text-sm">
          Creator dashboard
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {(data ?? []).map((p) => (
          <div key={p.id} className="glass p-4">
            <h3 className="font-semibold">{p.title}</h3>
            {p.description && <p className="text-sm text-slate-300 mt-1">{p.description}</p>}
            <p className="mt-3 text-lg">${(p.price_int / 100).toFixed(2)}</p>
            <form action={`/shop/buy/${p.id}`} method="post">
              <button className="inline-block mt-3 bg-brandA text-white px-4 py-2 rounded-lg text-sm">
                Buy
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  )
}
