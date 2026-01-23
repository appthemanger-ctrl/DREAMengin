export const dynamic = 'force-dynamic';

import { supaServer } from '@/lib/supabase/server';
import { widgetModules } from '@/lib/modules/registry.gen';

async function loadWidgets() {
  // load available widgets (promo, messages by default)
  const mods = [];
  for (const w of widgetModules) {
    try {
      const m = await w.loader();
      if (m && m.default) mods.push({ slug: w.slug, name: m.name || w.slug, Comp: m.default });
    } catch {}
  }
  return mods;
}

export default async function Home() {
  const s = supaServer();
  const { data: { user } } = await s.auth.getUser();
  const widgets = await loadWidgets();

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <section className="md:col-span-2 space-y-4">
        <div className="card">
          <div className="text-sm opacity-75">Feed</div>
          <div className="mt-2 space-y-2">
            <div className="card">Welcome {user?.email ?? 'guest'} — your feed will appear here.</div>
          </div>
        </div>
        <div className="card">
          <div className="text-sm opacity-75">Quick actions</div>
          <div className="mt-2 flex gap-2">
            <a className="btn" href="/connectors">Connect sources</a>
            <a className="btn" href="/ads">Ad slots</a>
            <a className="btn" href="/music">Music drops</a>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        {widgets.length === 0 && <div className="card">No widgets yet.</div>}
        {widgets.map(({slug, name, Comp}) => (
          <div className="card" key={slug}>
            <div className="font-medium mb-2 capitalize">{name || slug}</div>
            <Comp />
          </div>
        ))}
      </aside>
    </div>
  );
}
