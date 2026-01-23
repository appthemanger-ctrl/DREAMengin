import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import WidgetGrid from '@/components/WidgetGrid';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: widgets } = await supabase
    .from('widgets')
    .select('*')
    .eq('owner', session.user.id)
    .order('position', { ascending: true });

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Header />
      <WidgetGrid initial={widgets ?? []} />
    </main>
  );
}
