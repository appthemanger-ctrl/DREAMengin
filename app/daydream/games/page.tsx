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

const immersiveGameHref = (gameId: string) => buildGameLaunchHref(gameId, { openEngin: true, play: true, expand: true });

const WIDGETS: DaydreamWidget[] = [
  { id: 'platformer', emoji: '🤖', label: 'MADMAXI', desc: 'Babylon.js 3-D side-scroller', color: '#c8981a', href: immersiveGameHref('platformer') },
  { id: 'all-games', emoji: '🎮', label: 'Game Library', desc: 'Browse the live catalog', color: '#7c3aed', href: '/daydream/games' },
  { id: 'dreamquest', emoji: '✨', label: 'DREAMquest', desc: 'FF-style RPG · 5 dream layers', color: '#a78bfa', href: immersiveGameHref('dreamquest') },
  { id: 'dreamwars', emoji: '🌙', label: 'DREAMwars', desc: 'Nightmares vs Dreamers RTS', color: '#7c3aed', href: immersiveGameHref('dreamwars') },
  { id: 'neon-drift', emoji: '🏎️', label: 'Neon Drift', desc: 'WebGPU cyberpunk racer', color: '#0ff', href: immersiveGameHref('neon-drift') },
  { id: 'echo-arena', emoji: '🚀', label: 'Echo Arena', desc: 'WebGPU arena shooter', color: '#38bdf8', href: immersiveGameHref('echo-arena') },
];

const LIBRARY_SPOTLIGHT = [
  { label: 'MADMAXI', meta: 'Babylon.js 3-D · 150 levels', emoji: '🤖', href: immersiveGameHref('platformer') },
  { label: 'DREAMquest', meta: 'FF-style · 5 Dream Layers', emoji: '✨', href: immersiveGameHref('dreamquest') },
  { label: 'DREAMwars', meta: 'Nightmares vs Dreamers RTS', emoji: '🌙', href: immersiveGameHref('dreamwars') },
  { label: 'Neon Drift', meta: 'WebGPU · DualSense Ready', emoji: '🏎️', href: immersiveGameHref('neon-drift') },
  { label: 'Echo Arena', meta: 'WebGPU · Touch + controller ready', emoji: '🚀', href: immersiveGameHref('echo-arena') },
];

const CONSOLE_MODULES = [
  { title: 'Saved Runs', detail: 'GameEngin keeps your last launches and quick-resume slots ready for instant re-entry.' },
  { title: 'Universal HUD', detail: 'Touch, controller, and fullscreen HUD all live in the runtime so input stays attached to the game surface.' },
];

const SYSTEM_READOUT = [
  {
    title: 'Games Daydream',
    tone: '#7c3aed',
    detail: 'The discovery surface: browse the library, compare spotlight titles, and decide what to launch.',
  },
  {
    title: 'GameEngin',
    tone: '#38bdf8',
    detail: 'The runtime surface: boot the game, own fullscreen, keep saved sessions, and carry the active input layer.',
  },
  {
    title: 'Universal HUD',
    tone: '#22c55e',
    detail: 'The control surface: fast touch response, controller handoff, and a modern overlay instead of a toy remote panel.',
  },
];

const INPUT_CAPABILITIES = [
  'Instant touch HUD',
  'Controller auto-detect',
  'Fullscreen boot',
  'Quick resume memory',
  'Runtime-owned input',
  'Elite WebGPU titles',
] as const;

const RUNTIME_PATHS = [
  { name: 'Launch MADMAXI', emoji: '🤖', desc: 'Default immersive session', href: immersiveGameHref('platformer') },
  { name: 'Launch DREAMquest', emoji: '✨', desc: 'RPG route into GameEngin', href: immersiveGameHref('dreamquest') },
  { name: 'Launch DREAMwars', emoji: '🌙', desc: 'RTS route into GameEngin', href: immersiveGameHref('dreamwars') },
  { name: 'Launch Neon Drift', emoji: '🏎️', desc: 'WebGPU racing session', href: immersiveGameHref('neon-drift') },
  { name: 'Launch Echo Arena', emoji: '🚀', desc: 'Arena shooter session', href: immersiveGameHref('echo-arena') },
] as const;

const OFFICIAL_SPEC_NOTES = [
  'README.md defines Games Daydream as the surface and GameEngin as the runtime.',
  'The library explains the system before launch so users do not need a tutorial.',
  'Fullscreen play, saved sessions, and the universal HUD belong to GameEngin.',
] as const;

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
          subtitle="The library explains the system. GameEngin owns the runtime."
          icon={<Gamepad2 className="w-4 h-4" />}
          accentColor="#2a8ab8"
          badge="Games Daydream + GameEngin"
          containerClassName="max-w-6xl"
        />

        <div className="de-auth-content-wide space-y-4">
          <div className="de-auth-hero">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div style={{ flex: 1 }}>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.56)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.18)' }}>
                    <Sparkles className="w-3.5 h-3.5" />
                    Official surface contract: library on Side A, runtime on Side B
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--de-heading)', lineHeight: 1.05, marginTop: 12 }}>
                    Browse in Games Daydream.
                    <br />
                    Play inside GameEngin.
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.7, maxWidth: 700, marginTop: 10 }}>
                    This surface is the calm overview of the game system. The library explains what each route does, while GameEngin handles fullscreen, saved sessions, controller handoff, and the universal HUD.
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
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--de-accent)' }}>Side A</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--de-heading)', marginTop: 8 }}>Game Library</div>
                    <div style={{ fontSize: 12, color: 'var(--de-text-dim)', marginTop: 4 }}>Discovery, spotlight, and launch decisions with no fake scoreboards or toy clutter.</div>
                  </div>
                  <div style={{ borderRadius: 18, padding: 14, background: 'rgba(14,25,48,0.88)', border: '1px solid rgba(74,175,255,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: '#7dd3fc' }}>Side B</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#f8fbff', marginTop: 8 }}>GameEngin</div>
                    <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.72)', marginTop: 4 }}>Runtime-owned control, fullscreen boot, quick resume, and modern HUD response.</div>
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
                    Daydream
                  </span>
                </div>
                <div className="de-widget-body" style={{ paddingTop: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.6, marginBottom: 12 }}>
                    Browse the live GameEngin shelf here, then hand the chosen title to the runtime when you want to play.
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
                    Runtime-first
                  </span>
                </div>
                <div className="de-widget-body" style={{ paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7dd3fc', marginBottom: 8 }}>GameEngin Ready</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f8fbff', marginBottom: 8 }}>The game, controls, and memory stay on one surface.</div>
                  <div style={{ fontSize: 12, lineHeight: 1.65, color: 'rgba(226,232,240,0.78)', marginBottom: 14 }}>
                    Open GameEngin when you want the runtime view. The universal HUD, fullscreen shell, and saved-launch state all stay attached to the active session.
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
                  <span style={{ fontSize: 11, color: 'rgba(226,232,240,0.65)', marginLeft: 'auto' }}>Understand here, launch there</span>
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
                  <Sparkles className="w-4 h-4" style={{ color: '#7c3aed' }} />
                  <span className="de-widget-title ml-2">System Readout</span>
                </div>
                <div className="de-widget-body" style={{ display: 'grid', gap: 10 }}>
                  {SYSTEM_READOUT.map((item) => (
                    <div key={item.title} style={{ borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.44)', border: `1px solid ${item.tone}26` }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: item.tone, marginBottom: 6 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--de-text-dim)' }}>{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="de-widget">
                <div className="de-widget-header">
                  <Gamepad2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                  <span className="de-widget-title ml-2">Input Readiness</span>
                </div>
                <div className="de-widget-body">
                  <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.65, marginBottom: 12 }}>
                    The active control surface is tuned to react as soon as you touch it. No detached toy pad, no fake status cards — just a runtime-owned HUD that stays with the game.
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {INPUT_CAPABILITIES.map((capability) => (
                      <span key={capability} style={{ fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 999, background: 'rgba(34,197,94,0.08)', color: '#15803d', border: '1px solid rgba(34,197,94,0.2)' }}>
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="de-widget">
                <div className="de-widget-header">
                  <Zap className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                  <span className="de-widget-title ml-2">Launch Paths</span>
                </div>
                <div className="de-widget-body" style={{ display: 'grid', gap: 8 }}>
                  {RUNTIME_PATHS.map((path) => (
                    <Link
                      key={path.name}
                      href={path.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 12,
                        textDecoration: 'none',
                        background: 'rgba(15,23,42,0.04)',
                        border: '1px solid rgba(42,138,184,0.16)',
                      }}
                    >
                      <span style={{ width: 34, height: 34, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(42,138,184,0.1)' }}>
                        {path.emoji}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{path.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{path.desc}</div>
                      </div>
                      <Play className="w-3.5 h-3.5" style={{ color: 'var(--de-accent)', flexShrink: 0 }} />
                    </Link>
                  ))}
                </div>
                <div className="de-widget-actions">
                  <Link href={immersiveGameHref('platformer')} className="de-btn de-btn-primary text-xs">
                    Launch MADMAXI
                  </Link>
                </div>
              </div>

              <div className="de-widget">
                <div className="de-widget-header">
                  <Sparkles className="w-4 h-4" style={{ color: '#c8981a' }} />
                  <span className="de-widget-title ml-2">Official Surface Contract</span>
                </div>
                <div className="de-widget-body" style={{ display: 'grid', gap: 8 }}>
                  {OFFICIAL_SPEC_NOTES.map((note) => (
                    <div key={note} style={{ borderRadius: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.44)', border: '1px solid rgba(200,152,26,0.18)', fontSize: 12, lineHeight: 1.6, color: 'var(--de-text-dim)' }}>
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DaydreamShell>
  );
}
