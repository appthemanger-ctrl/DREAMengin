import { redirect } from 'next/navigation';
import { supaServer } from '@/lib/supabase/server';
import DrEamChat from '@/components/DrEamChat';
import FeedCard from '@/components/FeedCard';
import { loadDreamFeed } from '@/lib/feed/query';
import { widgetModules } from '@/lib/modules/registry.gen';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const s = supaServer();
  const { data: { user } } = await s.auth.getUser();
  if (!user) redirect('/login');

  const items = await loadDreamFeed(user.id);
  const { data: widgets } = await s
    .from('widget_instances')
    .select('*')
    .eq('user_id', user.id)
    .order('order', { ascending: true });

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <section className="md:col-span-2 space-y-4">
        {items.length === 0 ? (
          <div className="card p-6">
            <div className="text-lg font-medium mb-1">Your DreamFeed is empty</div>
            <p className="opacity-80 mb-3">Connect sources or create a sample item.</p>
          </div>
        ) : (
          items.map((it: any) => <FeedCard key={it.id ?? it.external_id} item={it} />)
        )}
      </section>
      <aside className="space-y-4">
        <DrEamChat />
        <div className="card p-4">
          <div className="font-medium mb-2">Widgets</div>
          <div className="space-y-3">
            {(widgets ?? []).filter((w: any)=>w?.enabled ?? true).map((w: any, idx: number) => {
              const mod = widgetModules.find(m => m.slug === w.type || m.name === w.type);
              const Comp = mod?.Component;
              return (
                <div key={w.id ?? idx} className="card p-3">
                  <div className="text-sm font-medium mb-2">{mod?.name ?? w.type ?? 'Widget'}</div>
                  {Comp ? <Comp /> : <div className="text-xs opacity-60">Widget content</div>}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
