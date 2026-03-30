'use client';

/**
 * LibraryPanel — Standalone Game Library browser for the Games Engine app.
 *
 * Surfaces all available games with category filters, quick-launch buttons,
 * and a recent sessions list. Lives at /engines/games/library.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Search, Play, Star, Filter } from 'lucide-react';
import { GAMES } from '@/components/games/GamesHub';
import { buildGameLaunchHref } from '@/lib/games/navigation';

const CATEGORIES = ['All', ...Array.from(new Set(GAMES.map((g) => g.category ?? 'Other')))];

export default function LibraryPanel() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = GAMES.filter((g) => {
    const matchCat = category === 'All' || g.category === category;
    const matchSearch =
      !search ||
      g.label.toLowerCase().includes(search.toLowerCase()) ||
      (g.desc ?? '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Game Library</h1>
          <p className="text-sm text-white/50">{GAMES.length} games · browse, filter, launch</p>
        </div>

        {/* Search + Filter row */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search games…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c8981a]/60"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} className="text-white/40" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={
                  category === cat
                    ? { background: '#c8981a22', color: '#c8981a', border: '1px solid #c8981a55' }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Game grid */}
        {filtered.length === 0 ? (
          <p className="text-center text-white/30 text-sm py-12">No games match your search.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((game) => (
              <div
                key={game.id}
                className="relative flex flex-col gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#c8981a]/40 hover:bg-white/[0.07] transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{game.emoji ?? '🎮'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white truncate">{game.label}</div>
                    {game.category && (
                      <div className="text-xs text-white/40 mt-0.5">{game.category}</div>
                    )}
                  </div>
                </div>
                {game.desc && (
                  <p className="text-xs text-white/50 line-clamp-2">{game.desc}</p>
                )}
                <Link
                  href={buildGameLaunchHref(game.id, { play: true })}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#c8981a] hover:bg-[#d4a520] text-black text-xs font-bold transition-colors mt-auto"
                >
                  <Play size={13} />
                  Play Now
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
