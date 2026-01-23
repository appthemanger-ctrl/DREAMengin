
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import WidgetGrid from '@/components/WidgetGrid'

export default async function Home(){
  const supabase = createServerSupabase()
  const { data:{ session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const { data: widgets } = await supabase.from('widgets').select('*').eq('owner', session.user.id).order('position', { ascending: true })
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Header />
      <WidgetGrid initial={widgets??[]} />
    </main>
  )
}
