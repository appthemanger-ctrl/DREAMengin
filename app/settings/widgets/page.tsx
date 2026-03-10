import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LayoutGrid, Pin, Eye, EyeOff, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dreams – DREAMengin Settings' };

export default async function WidgetsSettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <LayoutGrid className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Dreams</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">HomeDream Dreams</span></div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)', marginBottom: 12 }}>
              Manage which Dreams appear on your HomeDream. Removing a Dream only hides it — your config is preserved.
            </p>
            {[
              { name: 'Main Feed',   pinned: true,  visible: true },
              { name: 'YouTube',     pinned: false, visible: true },
              { name: 'Spotify',     pinned: false, visible: true },
              { name: 'Weather',     pinned: false, visible: true },
              { name: 'Portfolio',   pinned: false, visible: false },
            ].map(({ name, pinned, visible }) => (
              <div key={name} className="de-row">
                <div style={{ flex: 1 }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{name}</span>
                  {pinned && <span className="ml-2 text-xs" style={{ color: 'var(--de-gold)' }}>📌 Pinned</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="de-icon-btn" title={pinned ? 'Unpin' : 'Pin'} disabled aria-label={pinned ? `Unpin ${name}` : `Pin ${name}`}>
                    <Pin className="w-3 h-3" />
                  </button>
                  <button type="button" className="de-icon-btn" title={visible ? 'Hide' : 'Show'} disabled aria-label={visible ? `Hide ${name}` : `Show ${name}`}>
                    {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="de-widget-actions">
            <Link href="/homedream" className="de-btn de-btn-primary text-xs">
              <Plus className="w-3 h-3" /> Add Dream
            </Link>
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Edit Mode</span></div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>
              Enter Edit Mode from the HomeDream to drag, reorder, resize, and pin Dreams. Changes auto-save when you tap Done.
            </p>
          </div>
          <div className="de-widget-actions">
            <Link href="/homedream" className="de-btn de-btn-ghost text-xs">Go to HomeDream →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
