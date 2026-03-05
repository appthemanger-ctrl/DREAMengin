'use client';

import { useEffect, useState } from 'react';
import { Trophy, Loader2, AlertCircle } from 'lucide-react';

interface ScoreProfile {
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface ScoreEntry {
  id: string;
  user_id: string;
  game: string;
  score: number;
  level: number | null;
  achieved_at: string;
  rank: number;
  profile: ScoreProfile | null;
}

interface Props {
  game: string;
}

const RANK_MEDAL: Record<number, { emoji: string; color: string; label: string }> = {
  1: { emoji: '🥇', color: '#c8981a', label: '1st' },
  2: { emoji: '🥈', color: '#8b9eb0', label: '2nd' },
  3: { emoji: '🥉', color: '#a0674a', label: '3rd' },
};

function RankBadge({ rank }: { rank: number }) {
  const medal = RANK_MEDAL[rank];
  if (medal) {
    return (
      <span className="text-lg leading-none" aria-label={medal.label}>
        {medal.emoji}
      </span>
    );
  }
  return (
    <span
      className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
      style={{ background: 'rgba(160,195,240,0.15)', color: 'var(--de-text-dim)' }}
    >
      {rank}
    </span>
  );
}

export default function Leaderboard({ game }: Props) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/game-scores?game=${encodeURIComponent(game)}&limit=10`)
      .then((res) => res.json())
      .then(({ data, error: err }) => {
        if (err) {
          setError(err);
        } else {
          setScores(data ?? []);
        }
      })
      .catch(() => setError('Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [game]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--de-text-dim)' }}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Loading leaderboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-6 text-xs" style={{ color: '#e05d5d' }}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 gap-3">
        <Trophy className="w-7 h-7 opacity-20" style={{ color: 'var(--de-gold)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>
          No scores yet
        </p>
        <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
          Play to get on the board!
        </p>
      </div>
    );
  }

  return (
    <ol className="divide-y" style={{ '--divider': 'rgba(160,195,240,0.15)' } as React.CSSProperties}>
      {scores.map((entry) => {
        const isFirst = entry.rank === 1;
        const handle = entry.profile?.handle || entry.profile?.display_name || 'Anonymous';

        return (
          <li
            key={entry.id}
            className="flex items-center gap-3 py-2.5 px-1"
            style={{
              borderBottomColor: 'rgba(160,195,240,0.15)',
              background: isFirst
                ? 'linear-gradient(90deg, rgba(200,152,26,0.08), transparent)'
                : 'transparent',
            }}
          >
            {/* Rank */}
            <div className="w-7 flex items-center justify-center flex-shrink-0">
              <RankBadge rank={entry.rank} />
            </div>

            {/* Player handle */}
            <div className="flex-1 min-w-0">
              <span
                className="text-sm font-semibold truncate block"
                style={{ color: isFirst ? 'var(--de-gold)' : 'var(--de-heading)' }}
              >
                {handle}
              </span>
              {entry.level !== null && (
                <span className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
                  Level {entry.level}
                </span>
              )}
            </div>

            {/* Score */}
            <span
              className="text-sm font-bold tabular-nums flex-shrink-0"
              style={{ color: isFirst ? 'var(--de-gold)' : 'var(--de-accent)' }}
            >
              {entry.score.toLocaleString()}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
