import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Play, Sparkles } from 'lucide-react';
import GamesHub from '@/components/games/GamesHub';
import GameRemoteIsland from '@/components/games/GameRemoteIsland';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import GameEngin from '@/components/daydream/GameEngin';
import { GAME_QUALITY_PILLARS } from '@/lib/games/quality-plan';
import { buildGameLaunchHref } from '@/lib/games/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Games Daydream – DREAMengin', description: 'Play, challenge, and compete.' };

const WIDGETS: DaydreamWidget[] = [
  { id: 'platformer', emoji: '🏎',  label: 'MADMAXI',       desc: 'Babylon.js 3-D side-scroller',  color: '#c8981a', href: buildGameLaunchHref('platformer') },
  { id: 'all-games',  emoji: '🎮', label: 'All 23 Games', desc: 'Browse all game categories',    color: '#7c3aed', href: '/daydream/games' },
  { id: 'sprint',     emoji: '📝', label: 'Word Sprint',  desc: '60-second typing challenge',    color: '#10b981', href: buildGameLaunchHref('word-sprint') },
  { id: 'memory',     emoji: '🧩', label: 'Memory Grid',  desc: 'Flip cards, match all pairs',   color: '#6366f1', href: buildGameLaunchHref('memory-grid') },
  { id: 'tap',        emoji: '⚡', label: 'Speed Tap',    desc: 'Tap as fast as you can',        color: '#f59e0b', href: buildGameLaunchHref('speed-tap') },
  { id: 'scores',     emoji: '🏆', label: 'Leaderboard',  desc: 'Your personal bests',           color: '#c8981a', href: '/daydream/games' },
];

const LIBRARY_SPOTLIGHT = [
  { label: 'MADMAXI', meta: 'Babylon.js 3-D · 150 levels', emoji: '🏎', href: buildGameLaunchHref('platformer') },
  { label: 'Word Sprint', meta: '1 minute typing rush', emoji: '📝', href: buildGameLaunchHref('word-sprint') },
  { label: 'Memory Grid', meta: 'Quick pattern recall', emoji: '🧩', href: buildGameLaunchHref('memory-grid') },
  { label: 'Speed Tap', meta: 'Fast reflex score chase', emoji: '⚡', href: buildGameLaunchHref('speed-tap') },
];

/**
 * Games Daydream page.
 *
 * Side A = game library + embedded remote.
 * Side B (GameEngin) = big-screen play surface + fullscreen mode.
 */
export default async function GamesDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Games"
      enginName="GameEngin"
      accentColor="#2a8ab8"
      daydreamType="games"
      widgets={WIDGETS}
      sideBComponent={GameEngin}
    >
      <div className="de-sky-bg min-h-screen">
        <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/homedream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1 }}>DREAMengin</div>
              <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                <Gamepad2 className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                <h1 className="text-base font-bold" style={{ color: 'var(--de-heading)' }}>Games</h1>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)' }}>Library + Remote</span>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6 pb-24 space-y-4">
          {/* Hero banner */}
          <div
            className="de-widget"
            style={{
              background: 'linear-gradient(135deg, rgba(42,138,184,0.14), rgba(124,58,237,0.08), rgba(200,152,26,0.12))',
              borderColor: 'rgba(42,138,184,0.28)',
            }}
          >
            <div className="de-widget-body" style={{ padding: 18 }}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div style={{ flex: 1 }}>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.56)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.18)' }}>
                    <Sparkles className="w-3.5 h-3.5" />
                    Game library · remote · console
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--de-heading)', lineHeight: 1.05, marginTop: 12 }}>
                    Pick a game. Use the remote.
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.7, maxWidth: 700, marginTop: 10 }}>
                    Browse all 23 games on the left, tap ▶ Play to launch any title into GameEngin, and use the remote on the right to control it.
                  </p>
                  <div className="flex flex-wrap gap-2" style={{ marginTop: 12 }}>
                    {GAME_QUALITY_PILLARS.slice(0, 4).map((pillar) => (
                      <span key={pillar.id} style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.56)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.18)' }}>
                        {pillar.title}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
                  <div style={{ borderRadius: 18, padding: 14, background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(42,138,184,0.16)' }}>
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--de-accent)' }}>Library</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--de-heading)', marginTop: 8 }}>23</div>
                    <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 4 }}>Arcade, strategy, puzzle, and challenge games.</div>
                  </div>
                  <div style={{ borderRadius: 18, padding: 14, background: 'rgba(14,25,48,0.88)', border: '1px solid rgba(74,175,255,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: '#7dd3fc' }}>Remote</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#f8fbff', marginTop: 8 }}>PLAY</div>
                    <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.72)', marginTop: 4 }}>Controller remote is right on this page — no flip needed.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main two-column layout: library left, remote + spotlight right */}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
            {/* LEFT — game library */}
            <div className="space-y-4">
              <div className="de-widget" style={{ borderColor: 'rgba(124,58,237,0.24)' }}>
                <div className="de-widget-header">
                  <Gamepad2 className="w-4 h-4" style={{ color: '#7c3aed' }} />
                  <span className="de-widget-title ml-2">Game Library</span>
                  <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.25)' }}>
                    23 games
                  </span>
                </div>
                <div className="de-widget-body" style={{ paddingTop: 12 }}>
                  <GamesHub />
                </div>
              </div>
            </div>

            {/* RIGHT — embedded remote + quick-play spotlight */}
            <div className="space-y-4">
              {/* Game Remote — embedded directly on the page */}
              <GameRemoteIsland />

              {/* Library Spotlight — quick links */}
              <div className="de-widget">
                <div className="de-widget-header">
                  <Play className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                  <span className="de-widget-title ml-2">Quick Play</span>
                </div>
                <div className="de-widget-body">
                  <div style={{ display: 'grid', gap: 8 }}>
                    {LIBRARY_SPOTLIGHT.map((game) => (
                      <Link
                        key={game.label}
                        href={game.href}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 12,
                          textDecoration: 'none',
                          background: 'rgba(255,255,255,0.48)',
                          border: '1px solid rgba(160,195,240,0.16)',
                        }}
                      >
                        <span style={{ width: 34, height: 34, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)', fontWeight: 800 }}>
                          {game.emoji}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{game.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{game.meta}</div>
                        </div>
                        <Play className="w-3.5 h-3.5" style={{ color: 'var(--de-accent)', flexShrink: 0 }} />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DaydreamShell>
  );
}
