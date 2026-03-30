'use client';

/**
 * ScoresPanel — Personal best scores & leaderboard view for the Games Engine app.
 *
 * Reads from the `game_scores` Supabase table (RLS enforced).
 * Lives at /engines/games/scores.
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trophy, RefreshCw, Share2, Loader2 } from 'lucide-react';

interface GameScore {
  id: string;
  game: string;
  score: number;
  created_at: string;
  shared: boolean;
}

export default function ScoresPanel() {
  const [scores, setScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadScores() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error: err } = await supabase
      .from('game_scores')
      .select('id, game, score, created_at, shared')
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(50);
    if (err) setError(err.message);
    else setScores(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadScores(); }, []);

  async function shareScore(id: string) {
    setSharing(id);
    const supabase = createClient();
    await supabase.from('game_scores').update({ shared: true }).eq('id', id);
    setScores((prev) => prev.map((s) => s.id === id ? { ...s, shared: true } : s));
    setSharing(null);
  }

  const formatGame = (g: string) =>
    g.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Scores</h1>
            <p className="text-sm text-white/50">Your personal bests across all games</p>
          </div>
          <button
            onClick={loadScores}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#c8981a]" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && scores.length === 0 && (
          <div className="text-center py-16 text-white/30 text-sm">
            <Trophy size={40} className="mx-auto mb-3 opacity-30" />
            No scores yet — go play some games!
          </div>
        )}

        {!loading && scores.length > 0 && (
          <div className="space-y-2">
            {scores.map((score, idx) => (
              <div
                key={score.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#c8981a]/30 transition-all"
              >
                <span className="text-lg font-bold text-white/20 w-6 text-center">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {formatGame(score.game)}
                  </div>
                  <div className="text-xs text-white/40">{formatDate(score.created_at)}</div>
                </div>
                <div
                  className="text-lg font-bold tabular-nums"
                  style={{ color: idx === 0 ? '#c8981a' : idx === 1 ? '#94a3b8' : idx === 2 ? '#a3703c' : 'rgba(255,255,255,0.7)' }}
                >
                  {score.score.toLocaleString()}
                </div>
                {!score.shared && (
                  <button
                    onClick={() => shareScore(score.id)}
                    disabled={sharing === score.id}
                    title="Share to leaderboard"
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 hover:bg-[#c8981a]/20 text-white/40 hover:text-[#c8981a] transition-all"
                  >
                    {sharing === score.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Share2 size={13} />}
                  </button>
                )}
                {score.shared && (
                  <span className="text-xs text-[#c8981a] font-medium">Shared</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
