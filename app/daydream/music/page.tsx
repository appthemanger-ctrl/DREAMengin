import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Music, DiscAlbum, TrendingUp, Upload, ListMusic, Sparkles, Gauge } from 'lucide-react';
import SoundRecorder from '@/components/music/SoundRecorder';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import StarMakerEngin from '@/components/daydream/StarMakerEngin';
import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader';
import { isDevBypassActive } from '@/lib/dev-bypass';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Music Studio – Dreamengin', description: 'Record, release, and manage your music.' };

const WIDGETS: DaydreamWidget[] = [
  { id: 'record',    emoji: '🎙️', label: 'Record',        desc: 'Open the studio recorder',    color: '#2a8ab8', href: '/daydream/music' },
  { id: 'upload',    emoji: '📤', label: 'Upload Track',  desc: 'Add a track to your library', color: '#6366f1', href: '/music/upload' },
  { id: 'releases',  emoji: '🎵', label: 'My Releases',   desc: 'Albums, singles, and EPs',    color: '#c8981a', href: '/music' },
  { id: 'analytics', emoji: '📊', label: 'Music Stats',   desc: 'Streams, plays, and reach',   color: '#22c55e', href: '/daydream/analytics' },
  { id: 'share',     emoji: '🔗', label: 'Share to Feed', desc: 'Post a track or update',      color: '#ec4899', href: '/daydream/create' },
  { id: 'connect',   emoji: '🔌', label: 'Connectors',    desc: 'Link Spotify, SoundCloud',    color: '#f59e0b', href: '/connectors' },
  { id: 'brand',     emoji: '🎨', label: 'Brand Hub',     desc: 'Your artist identity',        color: '#0ea5e9', href: '/daydream/brand' },
  { id: 'play',      emoji: '▶️', label: 'Play Mode',     desc: 'Listen and queue tracks',     color: '#8b5cf6', href: '/daydream/play' },
];

export default async function MusicDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');

  return (
    <DaydreamShell
      title="Music Studio"
      enginName="StarMakerEngin"
      accentColor="#2a8ab8"
      daydreamType="music"
      widgets={WIDGETS}
      sideBComponent={StarMakerEngin}
    >
      <div className="de-sky-bg min-h-screen">
        <AuthenticatedPageHeader
          backHref="/homedream"
          title="Music Studio"
          subtitle="Record, release, and manage your music."
          icon={<Music className="w-4 h-4" />}
          accentColor="#2a8ab8"
          badge="Daydream"
        />

        <div className="de-auth-content space-y-4">
          <div className="de-auth-hero">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--de-accent)', marginBottom: 8 }}>
                Audio Capture + Artist Flow
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--de-heading)', marginBottom: 10 }}>
                Build tracks, releases, and your artist identity in one place.
              </div>
              <div style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.7, maxWidth: 680 }}>
                Music Studio is now framed like a premium control surface: recorder first, release planning second, and direct paths into Brand, Create, and analytics without leaving the session.
              </div>
            </div>
          </div>

          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">Sound Recorder</span></div>
            <div className="de-widget-body"><SoundRecorder /></div>
          </div>

          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">Pro Launch Stack</span></div>
            <div className="de-widget-body">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Sparkles, label: 'HQ Playback', detail: 'custom synth preview' },
                  { icon: Gauge, label: 'Release Score', detail: 'distribution readiness' },
                  { icon: Music, label: 'AI Toplines', detail: 'key-aware melody ideas' },
                ].map(({ icon: Icon, label, detail }) => (
                  <div key={label} className="de-surface flex flex-col gap-2 p-3">
                    <Icon className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                    <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{label}</div>
                    <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{detail}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--de-text-dim)' }}>
                Open StarMakerEngin on Side B for mastering-grade playback preview, smarter melody generation, and launch planning.
              </p>
            </div>
          </div>

          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Label &amp; Releases</span>
              <Link href="/music" className="text-xs font-semibold" style={{ color: 'var(--de-accent)' }}>View All →</Link>
            </div>
            <div className="de-widget-body space-y-2">
              <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>Manage your releases, albums, and distribution from here.</p>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {[
                  { icon: DiscAlbum,  label: 'Albums',   count: '—' },
                  { icon: TrendingUp, label: 'Streams',  count: '—' },
                  { icon: Upload,     label: 'Releases', count: '—' },
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

          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">Playlists</span></div>
            <div className="de-widget-body">
              <div className="flex items-center gap-3 py-4" style={{ color: 'var(--de-text-dim)', fontSize: 13 }}>
                <ListMusic className="w-8 h-8 opacity-30" />
                <div>
                  <div className="font-semibold" style={{ color: 'var(--de-heading)' }}>No playlists yet</div>
                  <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Connect a music service to manage playlists here.</div>
                </div>
              </div>
            </div>
            <div className="de-widget-actions">
              <Link href="/connectors" className="de-btn de-btn-ghost text-xs">Connect Music Service</Link>
            </div>
          </div>
        </div>
      </div>
    </DaydreamShell>
  );
}
