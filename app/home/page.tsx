
import { supaServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DrEamChat from '@/components/DrEamChat';
import FeedCard from '@/components/FeedCard';
import { loadDreamFeed } from '@/lib/feed/query';
import { widgetModules } from '@/lib/modules/registry.gen';

async function ensureProfile() {
  'use server';
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  if (!user) return;
  const handle = (user.email?.split('@')[0] ?? user.id).replace(/[^a-z0-9_-]/gi,'').toLowerCase();
  await s.from('profiles').upsert({ user_id: user.id, handle, display_name: handle, visibility: 'public' }, { onConflict: 'user_id' });
}

export default async function Home(){
  const s = supaServer();
  const { data:{ user } } = await s.auth.getUser();
  if (!user) redirect('/login');

  await ensureProfile(); // create profile if missing

  const items = await loadDreamFeed(user.id);
  const { data: widgets } = await s.from('widget_instances').select('*').eq('user_id', user.id).order('order');

  async function createSample() {
    'use server';
    const sv = supaServer();
    const { data:{ user } } = await sv.auth.getUser();
    if (!user) return;
    await sv.from('feed_items').insert({
      user_id: user.id,
      source: 'custom', source_account: 'example', external_id: String(Date.now()),
      ts: new Date().toISOString(), title: 'Welcome to DreamFeed',
      summary: 'This is a sample feed item. Connect sources to see more.'
    });
  }

  return (
    <div className="grid grid-cols-12 gap-5">
      <aside className="col-span-12 md:col-span-3 space-y-3">
        {(widgets ?? []).filter((w:any)=>w.enabled).map((w:any)=>{
          const mod = widgetModules.find(m => m.slug === w.type || m.name === w.type);
          const Comp = mod?.Component;
          return (
            <div key={w.id} className="card p-3">
              <div className="font-medium mb-1">{mod?.name ?? w.type}</div>
              {Comp ? <Comp /> : <div className="text-xs text-gray-600">widget content</div>}
            </div>
          );
        })}
        <div className="card p-3"><DrEamChat /></div>
      </aside>

      <section className="col-span-12 md:col-span-6 space-y-3">
        {items.length === 0 ? (
          <div className="card p-5">
            <div className="text-lg font-semibold">Your DreamFeed</div>
            <p className="text-sm text-gray-600 mt-1">No items yet. Click to create a first item.</p>
            <form action={createSample}><button className="btn mt-3">Create sample item</button></form>
          </div>
        ) : items.map((it:any)=>(<FeedCard key={it.id} item={it} />))}
      </section>

      <aside className="col-span-12 md:col-span-3 space-y-3">
        <div className="card p-4">
          <div className="text-sm font-medium">Promos</div>
          <p className="text-xs text-gray-600 mt-1">Ad slots live here.</p>
        </div>
      </aside>
    </div>
  );
}
