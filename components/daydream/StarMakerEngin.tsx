'use client';

/**
 * StarMakerEngin — Side B control layer for the Music Daydream.
 *
 * Responsibilities (README spec §8.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - Show the user's music releases with live status badges.
 *   - Allow one-tap publish of draft releases (real Supabase write).
 *   - Surface the "Upload New Release" entry point.
 *
 * Security: reads only rows owned by the authenticated user (RLS enforced
 * server-side; owner_id = auth.uid() filter added client-side as defence-in-depth).
 * Follows AXIOM 3 (every element enables real action) and AXIOM 4 (security by default).
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Music, Radio, Upload } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface MusicRelease {
  id: string;
  title: string;
  visibility: string;
}

const ACCENT = '#2a8ab8';

export default function StarMakerEngin({ onBack }: Props) {
  const [releases, setReleases]     = useState<MusicRelease[]>([]);
  const [loading, setLoading]       = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user;
      if (!user || cancelled) { setLoading(false); return; }
      const { data } = await supabase
        .from('music_releases')
        .select('id, title, visibility')
        .eq('owner_id', user.id)
        .order('id', { ascending: false })
        .limit(20);
      if (!cancelled) {
        setReleases((data as MusicRelease[] | null) ?? []);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  async function handlePublish(releaseId: string) {
    setPublishing(releaseId);
    const supabase = createClient();
    const { error } = await supabase
      .from('music_releases')
      .update({ visibility: 'public' })
      .eq('id', releaseId);
    if (!error) {
      setReleases(prev =>
        prev.map(r => r.id === releaseId ? { ...r, visibility: 'public' } : r),
      );
    }
    setPublishing(null);
  }

  return (
    <div className="de-sky-bg min-h-screen">

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full"
            style={{
              background: 'rgba(160,195,240,0.15)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Back to Music Studio"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>

          <div
            style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(135deg, ${ACCENT}, rgba(200,152,26,0.8))`,
            }}
          />

          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>
              StarMakerEngin
            </div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Music Studio · Control Layer</div>
          </div>

          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
          >
            Side B
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>

        {/* Your Releases */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Your Releases</span>
            <Link href="/music" className="text-xs font-semibold" style={{ color: ACCENT }}>
              View All →
            </Link>
          </div>

          <div className="de-widget-body">
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                Loading releases…
              </p>
            ) : releases.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                <Music className="w-6 h-6 flex-shrink-0" style={{ color: ACCENT, opacity: 0.3 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                    No releases yet
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                    Upload your first track to get started.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {releases.map(r => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(160,195,240,0.18)',
                    }}
                  >
                    <Radio className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT, opacity: 0.7 }} />
                    <span
                      style={{
                        flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                      }}
                    >
                      {r.title}
                    </span>
                    <StatusBadge published={r.visibility === 'public'} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="de-widget-actions">
            <Link href="/daydream/music" className="de-btn de-btn-ghost text-xs">
              <Upload className="w-3 h-3 mr-1" />
              Upload New Release
            </Link>
          </div>
        </div>

        {/* Publishing Controls */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Publishing Controls</span>
          </div>

          <div className="de-widget-body">
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>Loading…</p>
            ) : releases.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                Upload a release above to manage its publishing status here.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {releases.map(r => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.45)',
                      border: '1px solid rgba(160,195,240,0.14)',
                    }}
                  >
                    <span
                      style={{
                        flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--de-heading)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                      }}
                    >
                      {r.title}
                    </span>

                    {r.visibility === 'public' ? (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>
                        ✓ Live
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePublish(r.id)}
                        disabled={publishing === r.id}
                        className="de-btn de-btn-primary"
                        style={{ fontSize: 10, padding: '4px 12px', flexShrink: 0, opacity: publishing === r.id ? 0.6 : 1 }}
                      >
                        {publishing === r.id ? 'Publishing…' : 'Publish'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Helpers ── */

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
        padding: '2px 8px', borderRadius: 999,
        background: published ? 'rgba(34,197,94,0.12)' : 'rgba(160,195,240,0.18)',
        color: published ? '#22c55e' : 'var(--de-text-dim)',
        border: published ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(160,195,240,0.25)',
      }}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  );
}
