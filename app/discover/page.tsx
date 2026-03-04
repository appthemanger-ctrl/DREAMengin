import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Discover – DREAMengin', description: 'Find people on DREAMengin.' };

const MOCK_PROFILES = [
  { id: 'm1', handle: 'skylarwaves', display_name: 'Skylar Waves', bio: 'Dreaming in frequencies 🎵', avatar_url: null },
  { id: 'm2', handle: 'neonpalm', display_name: 'Neon Palm', bio: 'Visual storyteller & night owl', avatar_url: null },
  { id: 'm3', handle: 'lunarecho', display_name: 'Lunar Echo', bio: 'Chasing stars and coffee ☕', avatar_url: null },
  { id: 'm4', handle: 'cyberbloom', display_name: 'Cyber Bloom', bio: 'Digital garden curator 🌿', avatar_url: null },
  { id: 'm5', handle: 'driftingink', display_name: 'Drifting Ink', bio: 'Poet at heart, coder by day', avatar_url: null },
  { id: 'm6', handle: 'solarcroft', display_name: 'Solar Croft', bio: 'Building dreams one pixel at a time', avatar_url: null },
  { id: 'm7', handle: 'velvetmoon', display_name: 'Velvet Moon', bio: 'Music producer 🎹 & midnight wanderer', avatar_url: null },
  { id: 'm8', handle: 'arcticpulse', display_name: 'Arctic Pulse', bio: 'Photographer exploring cold frontiers', avatar_url: null },
  { id: 'm9', handle: 'prismaticray', display_name: 'Prismatic Ray', bio: 'Color theory enthusiast & designer', avatar_url: null },
  { id: 'm10', handle: 'zephyrvault', display_name: 'Zephyr Vault', bio: 'Collector of rare moments ✨', avatar_url: null },
  { id: 'm11', handle: 'chromafield', display_name: 'Chroma Field', bio: '3D artist lost in virtual worlds', avatar_url: null },
  { id: 'm12', handle: 'novadrift', display_name: 'Nova Drift', bio: 'Astrophysics nerd & amateur filmmaker', avatar_url: null },
  { id: 'm13', handle: 'foxglovelab', display_name: 'Foxglove Lab', bio: 'Science meets art every morning', avatar_url: null },
  { id: 'm14', handle: 'tidewatcher', display_name: 'Tide Watcher', bio: 'Ocean lover & surfer 🌊', avatar_url: null },
  { id: 'm15', handle: 'midnightloom', display_name: 'Midnight Loom', bio: 'Weaving stories from darkness', avatar_url: null },
  { id: 'm16', handle: 'crystaldawn', display_name: 'Crystal Dawn', bio: 'Meditation guide & sunrise chaser', avatar_url: null },
  { id: 'm17', handle: 'indigopath', display_name: 'Indigo Path', bio: 'Travel blogger on a shoestring budget', avatar_url: null },
  { id: 'm18', handle: 'staticforest', display_name: 'Static Forest', bio: 'Ambient musician & nature lover 🌲', avatar_url: null },
  { id: 'm19', handle: 'glassarchive', display_name: 'Glass Archive', bio: 'Film nerd cataloguing forgotten cinema', avatar_url: null },
  { id: 'm20', handle: 'emberveil', display_name: 'Ember Veil', bio: 'Fashion designer with a dark aesthetic', avatar_url: null },
  { id: 'm21', handle: 'quantumleap7', display_name: 'Quantum Leap', bio: 'Physics PhD candidate & meme lord', avatar_url: null },
  { id: 'm22', handle: 'sablecrest', display_name: 'Sable Crest', bio: 'Mountain climber & hot chocolate aficionado', avatar_url: null },
  { id: 'm23', handle: 'orchidwave', display_name: 'Orchid Wave', bio: 'Botanist growing things, digital and real', avatar_url: null },
  { id: 'm24', handle: 'mirrorgate', display_name: 'Mirror Gate', bio: 'Philosopher asking the hard questions 🤔', avatar_url: null },
  { id: 'm25', handle: 'dawnengine', display_name: 'Dawn Engine', bio: "Builder of tomorrow's tools today ⚙️", avatar_url: null },
];

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { q } = await searchParams;

  let profiles: Array<{ id: string; handle: string; display_name: string | null; bio: string | null; avatar_url: string | null }> = [];

  if (q && q.trim().length > 0) {
    // Escape special PostgREST/ilike characters to prevent filter injection
    const safe = q.trim().replace(/[%_\\]/g, (c) => `\\${c}`);
    const { data } = await supabase
      .from('profiles')
      .select('id, handle, display_name, bio, avatar_url')
      .or(`handle.ilike.%${safe}%,display_name.ilike.%${safe}%`)
      .limit(20);
    profiles = data || [];
  }

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Search className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Discover</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Search form */}
        <form method="GET" action="/discover">
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search className="w-4 h-4" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--de-text-dim)', pointerEvents: 'none' }} />
              <input
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search by name or @handle"
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 36px',
                  borderRadius: 12,
                  border: '1px solid rgba(160,195,240,0.4)',
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(12px)',
                  fontSize: 14,
                  color: 'var(--de-text)',
                  outline: 'none',
                }}
              />
            </div>
            <button type="submit" className="de-btn de-btn-primary" style={{ padding: '10px 18px' }}>Search</button>
          </div>
        </form>

        {/* Results */}
        {q && q.trim().length > 0 && (
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Results for &quot;{q}&quot;</span>
              <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{profiles.length} found</span>
            </div>
            <div className="de-widget-body" style={{ padding: '4px 6px' }}>
              {profiles.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0' }}>
                  <Users className="w-8 h-8 opacity-20" style={{ color: 'var(--de-accent)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--de-heading)' }}>No profiles found</p>
                  <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Try a different name or handle</p>
                </div>
              ) : (
                profiles.map((p) => (
                  <Link key={p.id} href={`/profile/${p.handle}`} className="de-row" style={{ borderRadius: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(42,138,184,0.12)', border: '1px solid rgba(42,138,184,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, overflow: 'hidden' }}>
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt={p.handle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : '👤'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{p.display_name || p.handle}</div>
                      <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>@{p.handle}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* Default state */}
        {(!q || q.trim().length === 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="de-widget">
              <div className="de-widget-body flex flex-col items-center py-4 gap-2">
                <Search className="w-8 h-8 opacity-15" style={{ color: 'var(--de-accent)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--de-heading)' }}>Search for people</p>
                <p className="text-xs text-center" style={{ color: 'var(--de-text-dim)' }}>Find friends and creators by name or @handle</p>
              </div>
            </div>

            <div className="de-widget">
              <div className="de-widget-header">
                <span className="de-widget-title">Suggested Dreamers</span>
                <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{MOCK_PROFILES.length} dreamers</span>
              </div>
              <div className="de-widget-body" style={{ padding: '4px 6px' }}>
                {MOCK_PROFILES.map((p) => (
                  <div key={p.id} className="de-row" style={{ borderRadius: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(42,138,184,0.12)', border: '1px solid rgba(42,138,184,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {(p.display_name || p.handle)[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{p.display_name}</div>
                      <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>@{p.handle}</div>
                      {p.bio && <div className="text-xs" style={{ color: 'var(--de-text)', marginTop: 2 }}>{p.bio}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
