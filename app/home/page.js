import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Header from '../../components/Header'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: widgets } = await supabase
    .from('widgets')
    .select('*')
    .eq('owner', session.user.id)
    .order('position', { ascending: true })

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Header />
      <section className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl">Your widgets</h2>
        <a href="/home/add" className="bg-brandB px-4 py-2 rounded-lg text-sm">Add widget</a>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {(widgets ?? []).map((w) => (
          <div key={w.id} className="glass p-4">
            <h3 className="font-semibold">{w.title}</h3>
            {w.body && <p className="text-sm text-slate-300 mt-1">{w.body}</p>}
            {w.url && <a href={w.url} className="text-brandA text-sm underline mt-2 inline-block">Open link</a>}
          </div>
        ))}
      </div>
      {(widgets ?? []).length === 0 && (
        <p className="text-slate-400 mt-4">Add your first widget to see it here.</p>
      )}
    </main>
  )
}
