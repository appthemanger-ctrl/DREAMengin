'use client';

/**
 * GameEngin — Side B control layer for the Games Daydream.
 *
 * Responsibilities (README spec §9.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - Show the user's game scores and personal bests.
 *   - Allow one-tap publish of high scores (real Supabase write).
 *   - Surface the "Play Now" entry points for all live games.
 *
 * Security: reads only rows owned by the authenticated user (RLS enforced
 * server-side; user_id = auth.uid() filter added client-side as defence-in-depth).
 * Follows AXIOM 3 (every element enables real action) and AXIOM 4 (security by default).
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Trophy, Play, Share2 } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface GameScore {
  id: string;
  game: string;
  score: number;
  shared: boolean;
}

const ACCENT = '#2a8ab8';

const GAME_LABELS: Record<string, string> = {
  'platformer':  'Dr. Eams Platformer',
  'word-sprint': 'Word Sprint',
  'memory-grid': 'Memory Grid',
  'speed-tap':   'Speed Tap',
};

export default function GameEngin({ onBack }: Props) {
  const [scores, setScores]     = useState<GameScore[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sharing, setSharing]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user;
      if (!user || cancelled) { setLoading(false); return; }
      const { data } = await supabase
        .from('game_scores')
        .select('id, game, score, shared')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(20);
      if (!cancelled) {
        setScores((data as GameScore[] | null) ?? []);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  async function handleShare(scoreId: string) {
    setSharing(scoreId);
    const supabase = createClient();
    const { error } = await supabase
      .from('game_scores')
      .update({ shared: true })
      .eq('id', scoreId);
    if (!error) {
      setScores(prev =>
        prev.map(s => s.id === scoreId ? { ...s, shared: true } : s),
      );
    }
    setSharing(null);
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
            aria-label="Back to Games"
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
              GameEngin
            </div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Games Studio · Control Layer</div>
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

        {/* Quick Launch */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Gamepad2 className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Quick Launch</span>
          </div>

          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'platformer',  label: 'Dr. Eams Platformer', emoji: '∞',  href: '/game'           },
                { id: 'word-sprint', label: 'Word Sprint',          emoji: '📝', href: '/daydream/games' },
                { id: 'memory-grid', label: 'Memory Grid',          emoji: '🧩', href: '/daydream/games' },
                { id: 'speed-tap',   label: 'Speed Tap',            emoji: '⚡', href: '/daydream/games' },
              ].map(game => (
                <div
                  key={game.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(160,195,240,0.18)',
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{game.emoji}</span>
                  <span
                    style={{
                      flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)',
                    }}
                  >
                    {game.label}
                  </span>
                  <Link
                    href={game.href}
                    className="de-btn de-btn-primary"
                    style={{ fontSize: 10, padding: '4px 12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Play className="w-3 h-3 fill-current" /> Play
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Personal Bests */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Trophy className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title ml-2">Personal Bests</span>
          </div>

          <div className="de-widget-body">
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                Loading scores…
              </p>
            ) : scores.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                <Gamepad2 className="w-6 h-6 flex-shrink-0" style={{ color: ACCENT, opacity: 0.3 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                    No scores yet
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                    Play a game above to record your first score.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scores.map(s => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(160,195,240,0.18)',
                    }}
                  >
                    <Trophy className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--de-gold)', opacity: 0.7 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12, fontWeight: 600, color: 'var(--de-heading)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {GAME_LABELS[s.game] ?? s.game}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                        Score: <strong style={{ color: 'var(--de-heading)' }}>{s.score.toLocaleString()}</strong>
                      </div>
                    </div>
                    <SharedBadge shared={s.shared} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Share Controls */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Share2 className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Share to Leaderboard</span>
          </div>

          <div className="de-widget-body">
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>Loading…</p>
            ) : scores.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                Play a game to record a score you can share to the leaderboard.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scores.map(s => (
                  <div
                    key={s.id}
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
                      {GAME_LABELS[s.game] ?? s.game} — {s.score.toLocaleString()}
                    </span>

                    {s.shared ? (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>
                        ✓ Shared
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleShare(s.id)}
                        disabled={sharing === s.id}
                        className="de-btn de-btn-primary"
                        style={{ fontSize: 10, padding: '4px 12px', flexShrink: 0, opacity: sharing === s.id ? 0.6 : 1 }}
                      >
                        {sharing === s.id ? 'Sharing…' : 'Share'}
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

function SharedBadge({ shared }: { shared: boolean }) {
  return (
    <span
      style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
        padding: '2px 8px', borderRadius: 999,
        background: shared ? 'rgba(34,197,94,0.12)' : 'rgba(160,195,240,0.18)',
        color: shared ? '#22c55e' : 'var(--de-text-dim)',
        border: shared ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(160,195,240,0.25)',
      }}
    >
      {shared ? 'On Board' : 'Private'}
    </span>
  );
}
