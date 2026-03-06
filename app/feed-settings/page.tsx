import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Rss, Sliders, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Feed Settings – DREAMengin' };

export default async function FeedSettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Rss className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Feed</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        <div className="de-notice">
          Your feed is made of slices — sections of content from connected services. You control what shows up and in what order.
        </div>

        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Active Slices</span>
            <Link href="/connectors" className="de-btn de-btn-ghost text-xs" style={{ padding: '4px 10px' }}>
              <Plus className="w-3 h-3" /> Add
            </Link>
          </div>
          <div className="de-widget-body flex flex-col items-center py-6 gap-2">
            <Rss className="w-8 h-8 opacity-20" style={{ color: 'var(--de-accent)' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>No feed slices yet</p>
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
              Connect a service in <Link href="/connectors" style={{ color: 'var(--de-accent)' }}>Connectors</Link> then choose which parts to add to your feed.
            </p>
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header">
            <Sliders className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">Feed Preferences</span>
          </div>
          <div className="de-widget-body">
            {[
              { label: 'Show DREAMengin updates',  desc: 'News and updates from DREAMengin itself.',        on: true  },
              { label: 'Auto-refresh every 5 min', desc: 'Refresh feed automatically (battery-aware).',     on: true  },
              { label: 'Show empty state guides',  desc: 'Show helpful tips when the feed is empty.',       on: true  },
            ].map(({ label, desc, on }) => (
              <div key={label} className="de-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{desc}</div>
                </div>
                <div style={{ width: 44, height: 26, borderRadius: 13, background: on ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
