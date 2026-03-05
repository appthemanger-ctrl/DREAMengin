import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Music, Upload, ExternalLink, ArrowLeft, Play } from 'lucide-react';
import PlatformBadge from '@/components/ui/PlatformBadge';

export const dynamic = 'force-dynamic';

const MUSIC_PLATFORMS = [
  { name: 'spotify',      label: 'Spotify',      href: '/connectors' },
  { name: 'youtube',      label: 'YouTube',       href: '/connectors' },
  { name: 'apple-music',  label: 'Apple Music',   href: '/connectors' },
  { name: 'soundcloud',   label: 'SoundCloud',    href: '/connectors' },
  { name: 'tiktok',       label: 'TikTok',        href: '/connectors' },
  { name: 'twitch',       label: 'Twitch',        href: '/connectors' },
];

function MusicPlatformRow() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
      {MUSIC_PLATFORMS.map(({ name, label, href }) => (
        <Link key={name} href={href} aria-label={`Connect ${label}`}
          className="flex flex-col items-center gap-1.5 opacity-75 hover:opacity-100 transition-opacity">
          <PlatformBadge name={name} size={48} label={label} />
          <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
        </Link>
      ))}
    </div>
  );
}

export default async function MusicPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch music releases
  const { data: musicData } = await supabase
    .from('music_releases')
    .select(`
      *,
      profiles!inner(handle, display_name)
    `)
    .or(`visibility.eq.public,user_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  // Demo tracks to show UI when no real data exists
  const demoMusic = [
    {
      id: 'demo-1',
      title: 'Cosmic Dreams',
      embed_url: null,
      visibility: 'public',
      profiles: { handle: 'dreamengin', display_name: 'DreamEngin' }
    },
    {
      id: 'demo-2',
      title: 'Infinity Loop',
      embed_url: null,
      visibility: 'public',
      profiles: { handle: 'producer', display_name: 'Night Producer' }
    },
    {
      id: 'demo-3',
      title: 'Neural Pathways',
      embed_url: null,
      visibility: 'public',
      profiles: { handle: 'synthwave', display_name: 'Synthwave Artist' }
    },
    {
      id: 'demo-4',
      title: 'Digital Sunrise',
      embed_url: null,
      visibility: 'public',
      profiles: { handle: 'ambient', display_name: 'Ambient Sounds' }
    },
    {
      id: 'demo-5',
      title: 'Quantum Beat',
      embed_url: null,
      visibility: 'public',
      profiles: { handle: 'beats', display_name: 'Beat Maker' }
    },
    {
      id: 'demo-6',
      title: 'Torus Flow',
      embed_url: null,
      visibility: 'public',
      profiles: { handle: 'electronic', display_name: 'Electronic Vibes' }
    },
  ];

  const music = musicData && musicData.length > 0 ? musicData : demoMusic;

  return (
    <div className="de-sky-bg min-h-screen">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
            </Link>
            <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Music</h1>
          </div>
          <Link href="/music/upload" className="de-btn de-btn-primary" style={{ gap: 6, minHeight: 40 }}>
            <Upload className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(42,138,184,0.12)' }}>
              <Music className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--de-heading)' }}>Music</h1>
          </div>
          <Link href="/music/upload" className="de-btn de-btn-primary" style={{ gap: 6 }}>
            <Upload className="w-4 h-4" />
            Upload
          </Link>
        </div>

        {/* Music Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {music?.map((track) => (
            <div key={track.id} className="de-widget overflow-hidden" style={{ padding: 0 }}>
              {track.embed_url ? (
                <iframe
                  src={track.embed_url}
                  width="100%"
                  height="180"
                  allow="autoplay; clipboard-write; encrypted-media"
                  style={{ border: 0, display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', height: 176, background: 'rgba(42,138,184,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <Music style={{ width: 48, height: 48, color: 'var(--de-text-dim)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--de-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play style={{ width: 24, height: 24, color: '#fff', marginLeft: 3 }} />
                    </div>
                  </div>
                </div>
              )}
              <div style={{ padding: '14px 16px' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--de-heading)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</h3>
                <p className="text-xs" style={{ color: 'var(--de-text-dim)', marginBottom: 10 }}>by @{track.profiles?.handle}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {track.embed_url?.includes('spotify') && (
                    <a href={track.embed_url.replace('embed/', '')} target="_blank" rel="noopener noreferrer"
                      className="de-btn de-btn-ghost" style={{ fontSize: 12, padding: '4px 10px', minHeight: 32, gap: 5 }}>
                      <ExternalLink style={{ width: 12, height: 12 }} /> Spotify
                    </a>
                  )}
                  {track.embed_url?.includes('youtube') && (
                    <a href={track.embed_url.replace('embed/', 'watch?v=')} target="_blank" rel="noopener noreferrer"
                      className="de-btn de-btn-ghost" style={{ fontSize: 12, padding: '4px 10px', minHeight: 32, gap: 5 }}>
                      <ExternalLink style={{ width: 12, height: 12 }} /> YouTube
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Demo banner */}
        {(!musicData || musicData.length === 0) && music.length > 0 && (
          <div className="mt-8 de-notice" style={{ textAlign: 'center' }}>
            These are sample tracks. Upload your first track to share your music!
          </div>
        )}

        {/* Stream on section */}
        <div className="mt-10">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--de-text-dim)', textAlign: 'center', marginBottom: 16 }}>
            Stream on
          </p>
          <MusicPlatformRow />
        </div>
      </div>
    </div>
  );
}
