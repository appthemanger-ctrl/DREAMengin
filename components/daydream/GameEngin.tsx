'use client';

/**
 * GameEngin — Side B control layer for the Games Daydream.
 *
 * Responsibilities (README spec §7.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - Surface the user's personal game scores and achievements.
 *   - Provide direct entry points to each playable game.
 *   - Show leaderboard ranking summary.
 *
 * Security: reads only rows owned by the authenticated user (RLS enforced
 * server-side; user_id = auth.uid() filter added client-side as defence-in-depth).
 * Follows AXIOM 3 (every element enables real action) and AXIOM 4 (security by default).
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Trophy, Play } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface GameScore {
  id: string;
  game: string;
  score: number;
  created_at: string;
}

const ACCENT = '#2a8ab8';

const GAME_LABELS: Record<string, string> = {
  platformer: 'Dr. Eams Platformer',
  'word-sprint': 'Word Sprint',
  'memory-grid': 'Memory Grid',
  'speed-tap': 'Speed Tap',
};

export default function GameEngin({ onBack }: Props) {
  const [scores, setScores]   = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(async (res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user;
      if (!user || cancelled) { setLoading(false); return; }
      const { data } = await supabase
        .from('game_scores')
        .select('id, game, score, created_at')
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

  /* Group scores by game, keep personal best per game */
  const bestByGame = scores.reduce<Record<string, number>>((acc, s) => {
    if (acc[s.game] === undefined || s.score > acc[s.game]) acc[s.game] = s.score;
    return acc;
  }, {});

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
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Games · Control Layer</div>
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

        {/* Personal Bests */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Trophy className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title ml-2">Personal Bests</span>
            <Link href="/daydream/games" className="text-xs font-semibold ml-auto" style={{ color: ACCENT }}>
              View All →
            </Link>
          </div>

          <div className="de-widget-body">
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                Loading scores…
              </p>
            ) : Object.keys(bestByGame).length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                <Gamepad2 className="w-6 h-6 flex-shrink-0" style={{ color: ACCENT, opacity: 0.3 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                    No scores yet
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                    Play a game to see your personal bests here.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(bestByGame).map(([game, best]) => (
                  <div
                    key={game}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(160,195,240,0.18)',
                    }}
                  >
                    <Gamepad2 className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT, opacity: 0.7 }} />
                    <span
                      style={{
                        flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                      }}
                    >
                      {GAME_LABELS[game] ?? game}
                    </span>
                    <span
                      style={{
                        fontSize: 12, fontWeight: 800, color: ACCENT,
                        background: `${ACCENT}14`, padding: '2px 10px',
                        borderRadius: 999, border: `1px solid ${ACCENT}25`,
                        flexShrink: 0,
                      }}
                    >
                      {best.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="de-widget-actions">
            <Link href="/game" className="de-btn de-btn-primary" style={{ gap: 8 }}>
              <Play className="w-3 h-3 fill-current" />
              Play Now
            </Link>
            <Link href="/daydream/games" className="de-btn de-btn-ghost text-xs">
              All Games
            </Link>
          </div>
        </div>

        {/* Quick Launch */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Quick Launch</span>
          </div>

          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { key: 'platformer',   label: 'Dr. Eams Platformer', emoji: '∞',  href: '/game' },
                { key: 'word-sprint',  label: 'Word Sprint',          emoji: '📝', href: '/daydream/games' },
                { key: 'memory-grid',  label: 'Memory Grid',          emoji: '🧩', href: '/daydream/games' },
                { key: 'speed-tap',    label: 'Speed Tap',            emoji: '⚡', href: '/daydream/games' },
              ].map(g => (
                <Link
                  key={g.key}
                  href={g.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
                    background: 'rgba(255,255,255,0.45)',
                    border: '1px solid rgba(160,195,240,0.14)',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{g.emoji}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>
                    {g.label}
                  </span>
                  <Play className="w-3 h-3 flex-shrink-0" style={{ color: ACCENT, opacity: 0.7 }} />
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
