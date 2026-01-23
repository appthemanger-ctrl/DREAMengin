import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Header from '@/components/ui/Header'
import WidgetGrid from '@/components/ui/WidgetGrid'

export default async function HomePage() {
  const s = createServerClient()
  const { data: { session } } = await s.auth.getSession()
  if (!session) redirect('/login')

  const { data: widgets } = await s
    .from('widgets')
    .select('*')
    .eq('owner', session.user.id)
    .order('position', { ascending: true })

  return (
    <main id="main" className="max-w-5xl mx-auto px-4 py-10">
      <Header />
      <WidgetGrid initial={widgets ?? []} />
    </main>
  )
}
