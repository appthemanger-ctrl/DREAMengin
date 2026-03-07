import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Heart, BookmarkPlus, ListMusic, Film, Music2 } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Play Daydream – DREAMengin', description: 'Your saved music and videos in one immersive space.' };

const WIDGETS: DaydreamWidget[] = [
  { id: 'music',   emoji: '🎵', label: 'Your Music',   desc: 'Albums, tracks, and singles', color: '#2a8ab8', href: '/music' },
  { id: 'vault',   emoji: '🎬', label: 'Media Vault',  desc: 'Your saved videos',           color: '#ef4444', href: '/daydream/media-vault' },
  { id: 'upload',  emoji: '📤', label: 'Upload Music', desc: 'Add to your collection',      color: '#c8981a', href: '/music/upload' },
  { id: 'discover',emoji: '🔍', label: 'Discover',     desc: 'Find music and creators',     color: '#22c55e', href: '/discover' },
  { id: 'studio',  emoji: '🎙️', label: 'Music Studio', desc: 'Record and create',           color: '#ec4899', href: '/daydream/music' },
  { id: 'algo',    emoji: '🧠', label: 'My Algorithm', desc: 'Control what plays next',     color: '#6366f1', href: '/settings/algorithm' },
];

export default async function PlayDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Play"
      enginName="PlayEngin"
      accentColor="#8b5cf6"
      widgets={WIDGETS}
    >
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Play className="w-5 h-5 fill-current" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Play</h1>
          <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)' }}>Daydream</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Now Playing */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Now Playing</span></div>
          <div className="de-widget-body flex flex-col items-center py-6 gap-4">
            <div style={{ width: 80, height: 80, borderRadius: 16, background: 'rgba(42,138,184,0.1)', border: '1px solid rgba(42,138,184,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Music2 className="w-8 h-8 opacity-30" style={{ color: 'var(--de-accent)' }} />
            </div>
            <div className="text-center">
              <div className="font-semibold" style={{ color: 'var(--de-heading)' }}>Nothing playing</div>
              <div className="text-xs mt-1" style={{ color: 'var(--de-text-dim)' }}>Choose a track or video below to start</div>
            </div>
            <div className="flex items-center gap-4">
              <button type="button" className="de-icon-btn" aria-label="Previous">⏮</button>
              <button type="button" className="de-btn de-btn-primary" style={{ width: 52, height: 52, borderRadius: '50%', padding: 0, fontSize: 20 }} aria-label="Play">
                <Play className="w-5 h-5 fill-current" />
              </button>
              <button type="button" className="de-icon-btn" aria-label="Next">⏭</button>
            </div>
          </div>
          <div className="de-widget-actions">
            <button type="button" className="de-btn de-btn-ghost text-xs"><Heart className="w-3 h-3" /> Favorite</button>
            <button type="button" className="de-btn de-btn-ghost text-xs"><BookmarkPlus className="w-3 h-3" /> Add to Feed</button>
            <button type="button" className="de-btn de-btn-ghost text-xs"><ListMusic className="w-3 h-3" /> Queue</button>
          </div>
        </div>

        {/* Saved Music */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Saved Music</span>
            <div className="de-tabs">
              <button type="button" className="de-tab active">All</button>
              <button type="button" className="de-tab">Recent</button>
              <button type="button" className="de-tab">Favorites</button>
            </div>
          </div>
          <div className="de-widget-body flex flex-col items-center py-6 gap-2">
            <Music2 className="w-8 h-8 opacity-20" style={{ color: 'var(--de-accent)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--de-heading)' }}>No saved music yet</p>
            <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Connect Spotify or Apple Music in <Link href="/connectors" style={{ color: 'var(--de-accent)' }}>Connectors</Link></p>
          </div>
        </div>

        {/* Saved Videos */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Saved Videos</span></div>
          <div className="de-widget-body flex flex-col items-center py-6 gap-2">
            <Film className="w-8 h-8 opacity-20" style={{ color: 'var(--de-accent)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--de-heading)' }}>No saved videos yet</p>
            <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Connect YouTube in <Link href="/connectors" style={{ color: 'var(--de-accent)' }}>Connectors</Link></p>
          </div>
        </div>

      </div>
    </div>
    </DaydreamShell>
  );
}