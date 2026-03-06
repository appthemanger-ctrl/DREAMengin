import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Discover – DREAMengin', description: 'Find people on DREAMengin.' };

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
