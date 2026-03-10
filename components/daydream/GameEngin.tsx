'use client';

/**
 * GameEngin — Side B control layer for the Games Daydream.
 *
 * Responsibilities (README spec §9.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - Show the user's personal best scores per game (from `game_scores` table).
 *   - Surface a direct entry to the GameRemote (dual analog sticks, PS5-compatible).
 *   - Provide a World Builder placeholder for future game-creation tooling.
 *
 * Security: score reads filtered by user_id = auth.uid() on top of server-side RLS.
 * Follows AXIOM 3 (every element enables real action) and AXIOM 4 (security by default).
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Trophy, Zap, Play, Star } from 'lucide-react';
import GameRemote from '@/components/games/GameRemote';

interface Props {
  onBack: () => void;
}

interface PersonalBest {
  game: string;
  score: number;
}

const ACCENT = '#2a8ab8';

const GAME_LABELS: Record<string, string> = {
  platformer: 'Dr. Eams Platformer',
  'word-sprint': 'Word Sprint',
  'memory-grid': 'Memory Grid',
  'speed-tap': 'Speed Tap',
};

export default function GameEngin({ onBack }: Props) {
  const [scores, setScores] = useState<PersonalBest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRemote, setShowRemote] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }
      const { data } = await supabase
        .from('game_scores')
        .select('game, score')
        .eq('user_id', user.id)
        .order('score', { ascending: false });
      if (!cancelled && data) {
        const seen = new Set<string>();
        const bests: PersonalBest[] = [];
        for (const row of data as PersonalBest[]) {
          if (!seen.has(row.game)) { seen.add(row.game); bests.push(row); }
        }
        setScores(bests);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (showRemote) return <GameRemote onBack={() => setShowRemote(false)} />;

  return (
    <div className="de-sky-bg min-h-screen">
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full"
            style={{ background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Back to Games"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>
          <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: `linear-gradient(135deg, ${ACCENT}, rgba(200,152,26,0.8))` }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>GameEngin</div>
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

      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>

        {/* Personal Bests */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Trophy className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title ml-2">Personal Bests</span>
          </div>
          <div className="de-widget-body">
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>Loading scores…</p>
            ) : scores.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                <Star className="w-6 h-6 flex-shrink-0" style={{ color: ACCENT, opacity: 0.3 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>No scores yet</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Play a game to record your first score.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scores.map(s => (
                  <div
                    key={s.game}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(160,195,240,0.18)' }}
                  >
                    <Gamepad2 className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT, opacity: 0.7 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      {GAME_LABELS[s.game] ?? s.game}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--de-gold)', flexShrink: 0 }}>
                      {s.score.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="de-widget-actions">
            <Link href="/daydream/games" className="de-btn de-btn-ghost text-xs">
              <Play className="w-3 h-3 fill-current mr-1" /> Play to improve
            </Link>
          </div>
        </div>

        {/* GameRemote access */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Zap className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
            <span className="de-widget-title ml-2">Controller</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 4 }}>
              Open the GameRemote — dual analog sticks, PS5-compatible, touch-enabled.
            </p>
          </div>
          <div className="de-widget-actions">
            <button onClick={() => setShowRemote(true)} className="de-btn de-btn-primary text-xs" style={{ gap: 6 }}>
              <Gamepad2 className="w-3 h-3" /> Open Controller
            </button>
          </div>
        </div>

        {/* World Builder — future */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">World Builder</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full ml-auto"
              style={{ background: 'rgba(160,195,240,0.15)', color: 'var(--de-text-dim)', border: '1px solid rgba(160,195,240,0.25)', fontWeight: 600, fontSize: 10 }}
            >
              Coming
            </span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
              Build game worlds, define logic rules, and configure entity behavior directly in GameEngin.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
