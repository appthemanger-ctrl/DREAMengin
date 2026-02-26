import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Music, Mic, ListMusic, DiscAlbum, TrendingUp, Upload } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Music Studio – DREAMengin', description: 'Record, release, and manage your music.' };

export default async function MusicDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Music className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Music Studio</h1>
          <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(42,138,184,0.12)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)' }}>Daydream</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Label / Album / Release card */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Label &amp; Releases</span>
            <Link href="/music" className="text-xs font-semibold" style={{ color: 'var(--de-accent)' }}>View All →</Link>
          </div>
          <div className="de-widget-body space-y-2">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>Manage your releases, albums, and distribution from here. Each release tracks streams, revenue, and retention.</p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { icon: DiscAlbum, label: 'Albums', count: '—' },
                { icon: TrendingUp, label: 'Streams', count: '—' },
                { icon: Upload, label: 'Releases', count: '—' },
              ].map(({ icon: Icon, label, count }) => (
                <div key={label} className="de-surface flex flex-col items-center gap-1 p-3 text-center">
                  <Icon className="w-5 h-5 mb-1" style={{ color: 'var(--de-accent)' }} />
                  <span className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>{count}</span>
                  <span className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="de-widget-actions">
            <Link href="/music/upload" className="de-btn de-btn-primary text-xs">+ New Release</Link>
          </div>
        </div>

        {/* Playlist Manager */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Playlist Manager</span>
          </div>
          <div className="de-widget-body">
            <div className="de-notice" style={{ marginBottom: 12 }}>
              <span>Connect a music service in <Link href="/connectors" style={{ color: 'var(--de-gold)', textDecoration: 'underline' }}>Connectors</Link> to manage playlists.</span>
            </div>
            <div className="flex items-center justify-center py-6" style={{ color: 'var(--de-text-dim)', fontSize: 13 }}>
              <ListMusic className="w-8 h-8 opacity-30 mr-3" /> No playlists yet
            </div>
          </div>
          <div className="de-widget-actions">
            <button type="button" className="de-btn de-btn-ghost text-xs">+ Create Playlist</button>
          </div>
        </div>

        {/* Sound Recorder */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Sound Recorder</span>
          </div>
          <div className="de-widget-body">
            <div className="flex flex-col items-center gap-4 py-4">
              <button
                type="button"
                className="de-btn de-btn-primary"
                style={{ width: 72, height: 72, borderRadius: '50%', padding: 0, fontSize: 28 }}
                aria-label="Record"
              >
                <Mic className="w-7 h-7" />
              </button>
              <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Tap to record a new track</p>
              {/* Waveform placeholder */}
              <div style={{ width: '100%', height: 40, background: 'rgba(160,195,240,0.1)', borderRadius: 8, border: '1px solid rgba(160,195,240,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Waveform will appear here</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
