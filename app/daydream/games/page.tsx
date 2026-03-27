import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Play, Sparkles, Trophy, Zap } from 'lucide-react';
import GamesHub from '@/components/games/GamesHub';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import GameEngin from '@/components/daydream/GameEngin';
import OpenDaydreamSideBButton from '@/components/daydream/OpenDaydreamSideBButton';
import AutoOpenGameEngin from '@/components/daydream/AutoOpenGameEngin';
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

const CONSOLE_MODULES = [
  { title: 'Launch Bay', detail: 'Resume a run, jump to a favorite, or spin up a fresh session.' },
  { title: 'Personal Bests', detail: 'Track your top scores without mixing them into the library view.' },
  { title: 'Controller Deck', detail: 'Remote, control profiles, world builder, scripts, and analytics live here.' },
];

/**
 * Games Daydream page.
 *
 * Side A: GamesHub as the library surface.
 * Side B: GameEngin as the console / control layer.
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
      <AutoOpenGameEngin />
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
            <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)' }}>Library + Console</span>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6 pb-24 space-y-4">
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
                    Library on Side A · Console on Side B
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--de-heading)', lineHeight: 1.05, marginTop: 12 }}>
                    Games stay in the library.
                    <br />
                    GameEngin stays on the console side.
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.7, maxWidth: 700, marginTop: 10 }}>
                    This surface is now focused on browsing, picking, and launching games. Flip over to GameEngin when you want the console tools: controller setup, personal bests, world builder, scripts, analytics, and multiplayer controls.
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
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--de-accent)' }}>Library Side</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--de-heading)', marginTop: 8 }}>23</div>
                    <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 4 }}>Live arcade, strategy, puzzle, and challenge games.</div>
                  </div>
                  <div style={{ borderRadius: 18, padding: 14, background: 'rgba(14,25,48,0.88)', border: '1px solid rgba(74,175,255,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: '#7dd3fc' }}>Console Side</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#f8fbff', marginTop: 8 }}>ENGIN</div>
                    <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.72)', marginTop: 4 }}>Boot the control deck when you want setup, scores, and tools.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
            <div className="space-y-4">
              <div className="de-widget" style={{ borderColor: 'rgba(124,58,237,0.24)' }}>
                <div className="de-widget-header">
                  <Gamepad2 className="w-4 h-4" style={{ color: '#7c3aed' }} />
                  <span className="de-widget-title ml-2">Game Library</span>
                  <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.25)' }}>
                    Side A
                  </span>
                </div>
                <div className="de-widget-body" style={{ paddingTop: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.6, marginBottom: 12 }}>
                    Browse the actual game shelf here. Pick a title, jump in, and keep the utility layer separated on the console side instead of mixing everything into one long feed.
                  </div>
                  <GamesHub />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="de-widget" style={{ borderColor: 'rgba(42,138,184,0.28)', background: 'linear-gradient(180deg, rgba(11,23,45,0.96), rgba(22,37,72,0.9))', color: '#f8fbff' }}>
                <div className="de-widget-header" style={{ borderBottomColor: 'rgba(125,211,252,0.18)' }}>
                  <Zap className="w-4 h-4" style={{ color: '#7dd3fc' }} />
                  <span className="de-widget-title ml-2" style={{ color: '#f8fbff' }}>GameEngin Console</span>
                  <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(125,211,252,0.12)', color: '#7dd3fc', border: '1px solid rgba(125,211,252,0.22)' }}>
                    Side B
                  </span>
                </div>
                <div className="de-widget-body" style={{ paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7dd3fc', marginBottom: 8 }}>Console Boot Ready</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f8fbff', marginBottom: 8 }}>Dedicated control deck, not the game shelf.</div>
                  <div style={{ fontSize: 12, lineHeight: 1.65, color: 'rgba(226,232,240,0.78)', marginBottom: 14 }}>
                    Flip to the other side for your launch bay, score publishing, controller deck, world builder, game scripts, and analytics. The library stays clean here; the systems live over there.
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {CONSOLE_MODULES.map((module) => (
                      <div key={module.title} style={{ borderRadius: 14, padding: '12px 14px', background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(125,211,252,0.14)' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#f8fbff', marginBottom: 4 }}>{module.title}</div>
                        <div style={{ fontSize: 11, lineHeight: 1.55, color: 'rgba(226,232,240,0.72)' }}>{module.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="de-widget-actions">
                  <OpenDaydreamSideBButton label="Open GameEngin Console" />
                  <span style={{ fontSize: 11, color: 'rgba(226,232,240,0.65)', marginLeft: 'auto' }}>Alt+F also flips sides</span>
                </div>
              </div>

              <div className="de-widget">
                <div className="de-widget-header">
                  <Play className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                  <span className="de-widget-title ml-2">Library Spotlight</span>
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

              <div className="de-widget">
                <div className="de-widget-header">
                  <Trophy className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
                  <span className="de-widget-title ml-2">Why the split works</span>
                </div>
                <div className="de-widget-body">
                  <div style={{ display: 'grid', gap: 8 }}>
                    {[
                      'The library side stays readable and fast to browse.',
                      'The console side can get deeper without cluttering game discovery.',
                      'Launching a game feels cleaner because the control systems are framed as a separate deck.',
                    ].map((item) => (
                      <div key={item} style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.6, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.48)', border: '1px solid rgba(160,195,240,0.16)' }}>
                        {item}
                      </div>
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
