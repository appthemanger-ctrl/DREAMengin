import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Discover – DREAMengin',
  description: 'Explore Daydream surfaces, find people, and discover what DREAMengin has to offer.',
};

/**
 * The 6 canonical Daydream surfaces — surfaced here so Discover is a true
 * gateway into the platform, not just a people-search box.
 *
 * Architecture: docs/ARCHITECTURE.md §3 (Daydream Surface Network) — every
 * Daydream surface has a canonical route and real capability; linking to them
 * here satisfies AXIOMS.md §3 ("every visible action must do something real").
 */
const DAYDREAMS = [
  {
    id: 'music',
    label: 'Music',
    emoji: '🎵',
    desc: 'Record, release, and share your sound',
    route: '/daydream/music',
    color: 'linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)',
  },
  {
    id: 'games',
    label: 'Games',
    emoji: '🎮',
    desc: 'Play and build in the GameEngin runtime',
    route: '/daydream/games',
    color: 'linear-gradient(135deg,#059669 0%,#10b981 100%)',
  },
  {
    id: 'lab',
    label: 'Lab',
    emoji: '🔬',
    desc: 'Experiment, simulate, and prototype',
    route: '/daydream/lab',
    color: 'linear-gradient(135deg,#0284c7 0%,#38bdf8 100%)',
  },
  {
    id: 'code',
    label: 'Code',
    emoji: '💻',
    desc: 'Write, review, and ship with CodeEngin',
    route: '/daydream/code',
    color: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)',
  },
  {
    id: 'brand',
    label: 'Brand',
    emoji: '🎨',
    desc: 'Define your identity with BrandingEngin',
    route: '/daydream/brand',
    color: 'linear-gradient(135deg,#b45309 0%,#f59e0b 100%)',
  },
  {
    id: 'create',
    label: 'Create',
    emoji: '✏️',
    desc: 'Produce and publish with ContentEngin',
    route: '/daydream/create',
    color: 'linear-gradient(135deg,#be185d 0%,#ec4899 100%)',
  },
] as const;

type Profile = { id: string; handle: string; display_name: string | null; bio: string | null; avatar_url: string | null };

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { q } = await searchParams;

  let profiles: Profile[] = [];
  let suggestedProfiles: Profile[] = [];

  if (q && q.trim().length > 0) {
    // Escape special PostgREST/ilike characters to prevent filter injection
    const safe = q.trim().replace(/[%_\\]/g, (c) => `\\${c}`);
    const { data } = await supabase
      .from('profiles')
      .select('id, handle, display_name, bio, avatar_url')
      .or(`handle.ilike.%${safe}%,display_name.ilike.%${safe}%`)
      .limit(20);
    profiles = data || [];
  } else {
    // Fetch real suggested profiles ordered by most recently joined, limit 20
    const { data } = await supabase
      .from('profiles')
      .select('id, handle, display_name, bio, avatar_url')
      .order('created_at', { ascending: false })
      .limit(20);
    suggestedProfiles = data || [];
  }

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/homedream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Search className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Discover</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Brand tagline ────────────────────────────────────────────────── */}
        {/* Only shown when there is no active search query */}
        {(!q || q.trim().length === 0) && (
          <div style={{ textAlign: 'center', paddingBottom: 4 }}>
            <p
              className="text-xs font-bold tracking-[0.2em] uppercase"
              style={{ color: 'rgba(200,152,26,0.8)', letterSpacing: '0.2em' }}
              aria-label="DREAMengin brand promise"
            >
              Explore&nbsp;·&nbsp;Discover&nbsp;·&nbsp;Dream
            </p>
          </div>
        )}

        {/* ── Daydream Explorer ────────────────────────────────────────────── */}
        {/* Shown when there is no active search query so users can explore the
            6 canonical Daydream surfaces directly from this surface.
            Architecture: docs/ARCHITECTURE.md §3 — Daydream Surface Network.
            Every tile links to a real canonical route (AXIOMS.md §3). */}
        {(!q || q.trim().length === 0) && (
          <div className="de-widget">
            <div className="de-widget-header">
              <span className="de-widget-title">Explore Daydreams</span>
              <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>6 creative surfaces</span>
            </div>
            <div
              className="de-widget-body"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                padding: '10px 10px 14px',
              }}
            >
              {DAYDREAMS.map((d) => (
                <Link
                  key={d.id}
                  href={d.route}
                  aria-label={`Open ${d.label} Daydream surface`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 8px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(160,195,240,0.25)',
                    textDecoration: 'none',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  {/* Daydream icon tile */}
                  <div
                    aria-hidden="true"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: d.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                      flexShrink: 0,
                    }}
                  >
                    {d.emoji}
                  </div>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: 'var(--de-heading)', textAlign: 'center', lineHeight: 1.2 }}
                  >
                    {d.label}
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      color: 'var(--de-text-dim)',
                      textAlign: 'center',
                      lineHeight: 1.3,
                      fontSize: 10,
                    }}
                  >
                    {d.desc}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Search form ──────────────────────────────────────────────────── */}
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

        {/* Default state — Suggested Dreamers */}
        {(!q || q.trim().length === 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="de-widget">
              <div className="de-widget-header">
                <span className="de-widget-title">Suggested Dreamers</span>
                {suggestedProfiles.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{suggestedProfiles.length} dreamers</span>
                )}
              </div>
              <div className="de-widget-body" style={{ padding: '4px 6px' }}>
                {suggestedProfiles.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0' }}>
                    <Users className="w-8 h-8 opacity-20" style={{ color: 'var(--de-accent)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--de-heading)' }}>No dreamers yet</p>
                    <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Be the first to join!</p>
                  </div>
                ) : (
                  suggestedProfiles.map((p) => (
                    <Link key={p.id} href={`/profile/${p.handle}`} className="de-row" style={{ borderRadius: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(42,138,184,0.12)', border: '1px solid rgba(42,138,184,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, overflow: 'hidden' }}>
                        {p.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt={p.handle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (p.display_name || p.handle)[0]?.toUpperCase() ?? '👤'
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{p.display_name || p.handle}</div>
                        <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>@{p.handle}</div>
                        {p.bio && <div className="text-xs" style={{ color: 'var(--de-text)', marginTop: 2 }}>{p.bio}</div>}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
