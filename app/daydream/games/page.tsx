import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Gamepad2, Play, Sparkles, Zap } from 'lucide-react';
import GamesHub from '@/components/games/GamesHub';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import GameEngin from '@/components/daydream/GameEngin';
import OpenDaydreamSideBButton from '@/components/daydream/OpenDaydreamSideBButton';
import AutoOpenGameEngin from '@/components/daydream/AutoOpenGameEngin';
import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader';
import { GAME_QUALITY_PILLARS } from '@/lib/games/quality-plan';
import { buildGameLaunchHref } from '@/lib/games/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';

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
  { title: 'Saved Runs', detail: 'GameEngin keeps your saved launches and quick resume slots.' },
  { title: 'Remote Dock', detail: 'The remote lives directly under the game screen in GameEngin — always there when you play.' },
];

/**
 * Games Daydream page.
 *
 * Side A = game library browser.
 * Side B (GameEngin) = big-screen play surface + remote directly under the game screen.
 */
export default async function GamesDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');

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
        <AuthenticatedPageHeader
          backHref="/homedream"
          title="Games"
          subtitle="Library, launches, and console handoff tuned for mobile play."
          icon={<Gamepad2 className="w-4 h-4" />}
          accentColor="#2a8ab8"
          badge="Library + Console"
          containerClassName="max-w-6xl"
        />

        <div className="de-auth-content-wide space-y-4">
          <div
            className="de-auth-hero"
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div style={{ flex: 1 }}>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.56)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.18)' }}>
                    <Sparkles className="w-3.5 h-3.5" />
                    Game library + engine handoff + console memory
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--de-heading)', lineHeight: 1.05, marginTop: 12 }}>
                    All the games live here.
                    <br />
                    Play + remote happen on the GameEngin side.
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.7, maxWidth: 700, marginTop: 10 }}>
                    Browse all 23 games here, then flip over to GameEngin to play. The remote controller sits directly under the game screen in GameEngin — right where it should be.
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
                    <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 4 }}>Arcade, strategy, puzzle, and challenge games on one shelf.</div>
                  </div>
                  <div style={{ borderRadius: 18, padding: 14, background: 'rgba(14,25,48,0.88)', border: '1px solid rgba(74,175,255,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: '#7dd3fc' }}>Console Memory</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#f8fbff', marginTop: 8 }}>SAVE</div>
                    <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.72)', marginTop: 4 }}>GameEngin is the big-screen play surface and memory deck behind the library.</div>
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
                    Home
                  </span>
                </div>
                <div className="de-widget-body" style={{ paddingTop: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.6, marginBottom: 12 }}>
                    Browse the actual game shelf here. Open GameEngin to play — the controller remote is right there under the game screen.
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
                    PS-style
                  </span>
                </div>
                <div className="de-widget-body" style={{ paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7dd3fc', marginBottom: 8 }}>Console Boot Ready</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f8fbff', marginBottom: 8 }}>Game screen + remote in one place.</div>
                  <div style={{ fontSize: 12, lineHeight: 1.65, color: 'rgba(226,232,240,0.78)', marginBottom: 14 }}>
                    Open GameEngin to play. The remote controller sits directly under the game screen — you don&apos;t need to go anywhere else to use it.
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
                  <OpenDaydreamSideBButton label="Open GameEngin" />
                  <span style={{ fontSize: 11, color: 'rgba(226,232,240,0.65)', marginLeft: 'auto' }}>Choose here, play there</span>
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

              {/* ── Feature 4: Personal Bests ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <span style={{ fontSize: 16 }}>🏅</span>
                  <span className="de-widget-title ml-2">Personal Bests</span>
                </div>
                <div className="de-widget-body">
                  {[
                    { game: '⚡ Speed Tap',   score: '4,820', rank: '#12' },
                    { game: '🧩 Memory Grid', score: '2:14',  rank: '#8'  },
                    { game: '📝 Word Sprint', score: '112 WPM', rank: '#5' },
                  ].map(pb => (
                    <div key={pb.game} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', marginBottom: 5, borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(200,152,26,0.15)' }}>
                      <span style={{ fontSize: 11, color: 'var(--de-heading)', fontWeight: 600 }}>{pb.game}</span>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#c8981a' }}>{pb.score}</span>
                        <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, background: 'rgba(99,102,241,0.1)', padding: '1px 5px', borderRadius: 4 }}>{pb.rank}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Feature 5: Season Pass ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <span style={{ fontSize: 16 }}>⭐</span>
                  <span className="de-widget-title ml-2">Season Pass</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#c8981a', background: 'rgba(200,152,26,0.12)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>Season 3</span>
                </div>
                <div className="de-widget-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: 'var(--de-text-dim)' }}>XP Progress</span>
                    <span style={{ fontWeight: 700, color: 'var(--de-heading)' }}>4,200 / 10,000 XP</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(200,152,26,0.12)', marginBottom: 8 }}>
                    <div style={{ height: '100%', borderRadius: 4, width: '42%', background: 'linear-gradient(90deg, #c8981a, #f59e0b)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {[
                      { tier: 1, reward: '💎', unlocked: true },
                      { tier: 2, reward: '🎮', unlocked: true },
                      { tier: 3, reward: '🏆', unlocked: true },
                      { tier: 4, reward: '🌟', unlocked: false },
                      { tier: 5, reward: '👑', unlocked: false },
                    ].map(t => (
                      <div key={t.tier} style={{ flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: 8, background: t.unlocked ? 'rgba(200,152,26,0.15)' : 'rgba(0,0,0,0.05)', border: `1px solid ${t.unlocked ? 'rgba(200,152,26,0.35)' : 'rgba(0,0,0,0.08)'}`, opacity: t.unlocked ? 1 : 0.5 }}>
                        <div style={{ fontSize: 16, filter: t.unlocked ? 'none' : 'grayscale(1)' }}>{t.reward}</div>
                        <div style={{ fontSize: 8, color: 'var(--de-text-dim)', marginTop: 2 }}>T{t.tier}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Feature 6: Daily Quests ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <span style={{ fontSize: 16 }}>📋</span>
                  <span className="de-widget-title ml-2">Daily Quests</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>2/4 done</span>
                </div>
                <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { quest: 'Play 3 games today',         xp: '+100', done: true  },
                    { quest: 'Reach 500 pts in Speed Tap', xp: '+200', done: true  },
                    { quest: 'Win a multiplayer match',    xp: '+300', done: false },
                    { quest: 'Post a high score',          xp: '+150', done: false },
                  ].map(q => (
                    <div key={q.quest} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: q.done ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.5)', border: `1px solid ${q.done ? 'rgba(34,197,94,0.2)' : 'rgba(0,0,0,0.06)'}` }}>
                      <span style={{ fontSize: 14 }}>{q.done ? '✅' : '⬜'}</span>
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--de-heading)', fontWeight: 600, textDecoration: q.done ? 'line-through' : 'none', opacity: q.done ? 0.6 : 1 }}>{q.quest}</span>
                      <span style={{ fontSize: 10, color: '#c8981a', fontWeight: 700 }}>{q.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Feature 7: Dream Economy ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <span style={{ fontSize: 16 }}>💰</span>
                  <span className="de-widget-title ml-2">Dream Economy</span>
                </div>
                <div className="de-widget-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
                    {[
                      { label: 'DreamCoins', val: '2,840', emoji: '🟡', color: '#c8981a' },
                      { label: 'Gems',       val: '142',   emoji: '💎', color: '#6366f1' },
                      { label: 'Tokens',     val: '28',    emoji: '🎫', color: '#ec4899' },
                    ].map(c => (
                      <div key={c.label} style={{ padding: '10px 6px', borderRadius: 9, background: `${c.color}0e`, border: `1px solid ${c.color}20`, textAlign: 'center' }}>
                        <div style={{ fontSize: 18 }}>{c.emoji}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: c.color }}>{c.val}</div>
                        <div style={{ fontSize: 8, color: 'var(--de-text-dim)', marginTop: 2 }}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Feature 8: Multiplayer Lobby ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <span style={{ fontSize: 16 }}>👥</span>
                  <span className="de-widget-title ml-2">Multiplayer Lobby</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#22c55e', fontWeight: 700, background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 5 }}>8 online</span>
                </div>
                <div className="de-widget-body">
                  {[
                    { name: '@player1', game: '⚡ Speed Tap', status: 'playing' },
                    { name: '@creator2', game: '🧩 Memory Grid', status: 'waiting' },
                    { name: '@dreamer3', game: '📝 Word Sprint', status: 'playing' },
                  ].map(p => (
                    <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', marginBottom: 5, borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(34,197,94,0.12)' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{p.game}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: p.status === 'playing' ? '#22c55e' : '#f59e0b', background: p.status === 'playing' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4, alignSelf: 'center' }}>{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Feature 9: Tournament Mode ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <span style={{ fontSize: 16 }}>🏆</span>
                  <span className="de-widget-title ml-2">Tournament Mode</span>
                </div>
                <div className="de-widget-body">
                  <div style={{ padding: '12px 14px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(200,152,26,0.1), rgba(200,152,26,0.03))', border: '1px solid rgba(200,152,26,0.25)' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#c8981a', marginBottom: 4 }}>Spring Speed Tournament</div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Starts: Sat Apr 5 · 2PM EST<br />Prize: 1,000 DreamCoins · 24 players</div>
                  </div>
                </div>
                <div className="de-widget-actions">
                  <Link href="/daydream/games" className="de-btn de-btn-primary text-xs">Register Now →</Link>
                </div>
              </div>

              {/* ── Feature 10: Game Analytics ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <span style={{ fontSize: 16 }}>📊</span>
                  <span className="de-widget-title ml-2">Game Analytics</span>
                </div>
                <div className="de-widget-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
                    {[
                      { label: 'Games Played', val: '48', color: '#6366f1' },
                      { label: 'Avg Session',  val: '12m', color: '#22c55e' },
                      { label: 'Win Rate',     val: '68%', color: '#c8981a' },
                    ].map(m => (
                      <div key={m.label} style={{ padding: '8px 6px', borderRadius: 9, background: `${m.color}0e`, border: `1px solid ${m.color}20`, textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: m.color }}>{m.val}</div>
                        <div style={{ fontSize: 8, color: 'var(--de-text-dim)', marginTop: 2 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Feature 11: Replay System ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <span style={{ fontSize: 16 }}>▶</span>
                  <span className="de-widget-title ml-2">Replay System</span>
                </div>
                <div className="de-widget-body">
                  {[
                    { game: '⚡ Speed Tap',   score: '4,820', date: '2h ago' },
                    { game: '🧩 Memory Grid', score: '2:14',  date: '1d ago' },
                  ].map(r => (
                    <div key={r.game} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', marginBottom: 5, borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(99,102,241,0.12)' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{r.game}</div>
                        <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{r.date}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#c8981a' }}>{r.score}</span>
                        <span style={{ fontSize: 18 }}>▶</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Feature 12: Social Challenge ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <span style={{ fontSize: 16 }}>🎯</span>
                  <span className="de-widget-title ml-2">Social Challenge</span>
                </div>
                <div className="de-widget-body">
                  <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
                    Challenge any creator to a head-to-head score battle. They get a notification and have 24h to beat your score.
                  </p>
                </div>
                <div className="de-widget-actions">
                  <Link href="/daydream/games" className="de-btn de-btn-primary text-xs">🏆 Challenge a Friend</Link>
                </div>
              </div>

              {/* ── Feature 13: Speedrun Timer ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <span style={{ fontSize: 16 }}>⏱</span>
                  <span className="de-widget-title ml-2">Speedrun Timer</span>
                </div>
                <div className="de-widget-body">
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'monospace', color: '#2a8ab8', letterSpacing: '0.04em' }}>02:34.817</div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 4 }}>PB: 02:31.204</div>
                  </div>
                  <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
                    {['Start', 'Split', 'Reset'].map(a => (
                      <div key={a} style={{ flex: 1, padding: '7px 4px', borderRadius: 8, background: a === 'Start' ? 'rgba(34,197,94,0.12)' : a === 'Reset' ? 'rgba(239,68,68,0.08)' : 'rgba(42,138,184,0.1)', border: `1px solid ${a === 'Start' ? 'rgba(34,197,94,0.25)' : a === 'Reset' ? 'rgba(239,68,68,0.2)' : 'rgba(42,138,184,0.2)'}`, textAlign: 'center', fontSize: 11, fontWeight: 700, color: a === 'Start' ? '#22c55e' : a === 'Reset' ? '#ef4444' : '#2a8ab8' }}>{a}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Feature 14: Achievements ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <span style={{ fontSize: 16 }}>🏅</span>
                  <span className="de-widget-title ml-2">Achievements</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#c8981a', fontWeight: 700, background: 'rgba(200,152,26,0.1)', padding: '2px 7px', borderRadius: 5 }}>3 new</span>
                </div>
                <div className="de-widget-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                    {[
                      { emoji: '🚀', title: 'First Launch', unlocked: true },
                      { emoji: '⚡', title: 'Speed Demon', unlocked: true },
                      { emoji: '🧩', title: 'Memory Master', unlocked: true },
                      { emoji: '🏆', title: 'Tournament Win', unlocked: false },
                      { emoji: '👑', title: 'Top 10', unlocked: false },
                    ].map(a => (
                      <div key={a.title} title={a.title} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 9, background: a.unlocked ? 'rgba(200,152,26,0.12)' : 'rgba(0,0,0,0.04)', border: `1px solid ${a.unlocked ? 'rgba(200,152,26,0.3)' : 'rgba(0,0,0,0.06)'}`, opacity: a.unlocked ? 1 : 0.4 }}>
                        <div style={{ fontSize: 20, filter: a.unlocked ? 'none' : 'grayscale(1)' }}>{a.emoji}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Feature 15: AI Director ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <span style={{ fontSize: 16 }}>🤖</span>
                  <span className="de-widget-title ml-2">AI Director</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>FREE</span>
                </div>
                <div className="de-widget-body">
                  <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
                    Adaptive difficulty AI — dynamically adjusts game challenge based on your skill level in real-time to maximize engagement.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                    {[
                      { label: 'Skill Level',    val: '74',    unit: '/100', color: '#6366f1' },
                      { label: 'Adaptation',     val: 'ON',    unit: '',     color: '#22c55e' },
                      { label: 'Engagement',     val: '91%',   unit: '',     color: '#ec4899' },
                      { label: 'Sessions/week',  val: '6',     unit: '',     color: '#f59e0b' },
                    ].map(m => (
                      <div key={m.label} style={{ padding: '8px 10px', borderRadius: 9, background: `${m.color}0e`, border: `1px solid ${m.color}20` }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: m.color }}>{m.val}<span style={{ fontSize: 10 }}>{m.unit}</span></div>
                        <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Feature 16: Game Quality Pillars ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <Sparkles className="w-4 h-4 mr-1" style={{ color: '#c8981a' }} />
                  <span className="de-widget-title">Quality Pillars</span>
                </div>
                <div className="de-widget-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                    {GAME_QUALITY_PILLARS.slice(0, 6).map(p => (
                      <div key={p.id} style={{ padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(200,152,26,0.15)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 2 }}>{p.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{p.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Feature 17: Controller Deck ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <Gamepad2 className="w-4 h-4 mr-1" style={{ color: '#2a8ab8' }} />
                  <span className="de-widget-title">Controller Deck</span>
                </div>
                <div className="de-widget-body">
                  <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
                    DualSense (PS5), Xbox, Nintendo Pro, mobile touch — all controller types auto-detected and configured for each game.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['🎮 DualSense', '🕹 Xbox', '📱 Touch'].map(c => (
                      <div key={c} style={{ flex: 1, padding: '7px 6px', borderRadius: 8, background: 'rgba(42,138,184,0.08)', border: '1px solid rgba(42,138,184,0.2)', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#2a8ab8' }}>{c}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Feature 18: World Builder ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <Zap className="w-4 h-4 mr-1" style={{ color: '#c8981a' }} />
                  <span className="de-widget-title">World Builder</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>FREE</span>
                </div>
                <div className="de-widget-body">
                  <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10 }}>
                    Visual ECS world editor — drag-and-drop entities, configure components, test physics, and publish custom game worlds.
                  </p>
                </div>
                <div className="de-widget-actions">
                  <Link href="/daydream/games" className="de-btn de-btn-primary text-xs">Open GameEngin →</Link>
                </div>
              </div>

              {/* ── Feature 19: Neon Drift + Echo Arena ── */}
              <div className="de-widget" style={{ marginBottom: 14 }}>
                <div className="de-widget-header">
                  <span style={{ fontSize: 16 }}>🎮</span>
                  <span className="de-widget-title ml-2">Elite WebGPU Games</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>FREE</span>
                </div>
                <div className="de-widget-body">
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[
                      { name: 'Neon Drift',   emoji: '🏎', desc: 'WebGPU neon racer', href: buildGameLaunchHref('neon-drift') },
                      { name: 'Echo Arena',   emoji: '🚀', desc: 'WebGPU space shooter', href: buildGameLaunchHref('echo-arena') },
                    ].map(g => (
                      <Link key={g.name} href={g.href} style={{ flex: 1, textDecoration: 'none' }}>
                        <div style={{ padding: '12px 10px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.22)', textAlign: 'center' }}>
                          <div style={{ fontSize: 28, marginBottom: 5 }}>{g.emoji}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{g.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 2 }}>{g.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Feature 20: GameEngin CTA ── */}
              <div style={{ background: 'linear-gradient(135deg, rgba(200,152,26,0.08), rgba(139,92,246,0.08))', borderRadius: 18, padding: '16px 18px', border: '1px solid rgba(200,152,26,0.2)', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#c8981a', marginBottom: 4 }}>GameEngin — 20 Features on Side B</div>
                <p style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5, margin: 0 }}>
                  Console Home · Launch Bay · Controller Deck · World Builder · Achievements · Physics Config ·
                  Game Scripts · Cross-Engin Sync · Multiplayer Lobby · Tournament Mode · Game Analytics · Replay System ·
                  Social Challenge · Season Pass · Daily Quests · Dream Economy · Speedrun Timer · AI Director · World Builder + more.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </DaydreamShell>
  );
}

