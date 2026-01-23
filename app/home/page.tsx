// app/home/page.tsx
export const dynamic = 'force-dynamic';

import { supaServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DrEamChat from '@/components/DrEamChat';
import FeedCard from '@/components/FeedCard';
import { loadDreamFeed } from '@/lib/feed/query';
import { widgetModules } from '@/lib/modules/registry.gen';

async function ensureProfile() {
  'use server';
  const s = supaServer();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return;
  const handle = (user.email?.split('@')[0] ?? user.id)
    .replace(/[^a-z0-9_-]/gi, '')
    .toLowerCase();
  await s
    .from('profiles')
    .upsert(
      { user_id: user.id, handle, display_name: handle, visibility: 'public' },
      { onConflict: 'user_id' }
    );
}

export default async function Home() {
  const s = supaServer();
  const { data: { user } } = await s.auth.getUser();
  if (!user) redirect('/login');

  await ensureProfile();

  const items = await loadDreamFeed(user.id);
  const { data: widgets } = await s
    .from('widget_instances')
    .select('*')
    .eq('user_id', user.id)
    .order('order');

  async function createSample() {
    'use server';
    const sv = supaServer();
    const { data: { user } } = await sv.auth.getUser();
    if (!user) return;
    await sv.from('feed_items').insert({
      user_id: user.id,
      source: 'custom',
      source_account_id: 'example',
      external_id: String(Date.now()),
      timestamp: new Date().toISOString(),
      title: 'Welcome to your DreamFeed',
      summary: 'This is a sample item. Connect sources to see more.',
      url: '#',
      importance_score: 1,
    });
  }

  return (
    <div className="space-y-6">
      {/* WIDGETS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(widgets ?? [])
          .filter((w: any) => w.enabled)
          .map((w: any) => {
            // widgetModules should be an array of { slug, name, Component }
            const mod = (widgetModules as any[]).find(
              (m: any) => m.slug === w.type || m.name === w.type
            );
            const Comp: any = mod?.Component;
            return (
              <div key={w.id} className="card p-3">
                <div className="font-medium mb-1">{mod?.name ?? w.type}</div>
                {Comp ? <Comp config={w.config} /> : <div>Widget content</div>}
              </div>
            );
          })}
      </section>

      {/* FEED */}
      <section className="space-y-3">
        {items.length === 0 ? (
          <div className="card p-6 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Your DreamFeed is empty</div>
              <div className="text-sm text-gray-500">
                Connect sources or create a sample item to get started.
              </div>
            </div>
            <form action={createSample}>
              <button className="btn">Create Sample Item</button>
            </form>
          </div>
        ) : (
          items.map((it: any) => <FeedCard key={it.id} item={it} />)
        )}
      </section>

      {/* DR. EAM (quick help) */}
      <section className="card p-4">
        {/* @ts-expect-error Server/Client boundary handled inside the component */}
        <DrEamChat />
      </section>
    </div>
  );
}
