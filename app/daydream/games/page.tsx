import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Trophy, Star, Play, Zap, Grid3x3 } from 'lucide-react';
import WordSprint from '@/components/games/WordSprint';
import MemoryGrid from '@/components/games/MemoryGrid';
import SpeedTap from '@/components/games/SpeedTap';
import Leaderboard from '@/components/games/Leaderboard';
import GamesHub from '@/components/games/GamesHub';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import GameEngin from '@/components/daydream/GameEngin';
import { GAME_QUALITY_PILLARS } from '@/lib/games/quality-plan';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Games Daydream – DREAMengin', description: 'Play, challenge, and compete.' };

const WIDGETS: DaydreamWidget[] = [
  { id: 'platformer', emoji: '∞',  label: 'Dr. Eams',     desc: '3-level platformer, play now',  color: '#2a8ab8', href: "/daydream/game" },
  { id: 'all-games',  emoji: '🎮', label: 'All 23 Games', desc: 'Browse all game categories',    color: '#7c3aed', href: "/daydream/game" },
  { id: 'sprint',     emoji: '📝', label: 'Word Sprint',  desc: '60-second typing challenge',    color: '#10b981', href: "/daydream/game" },
  { id: 'memory',     emoji: '🧩', label: 'Memory Grid',  desc: 'Flip cards, match all pairs',   color: '#6366f1', href: "/daydream/game" },
  { id: 'tap',        emoji: '⚡', label: 'Speed Tap',    desc: 'Tap as fast as you can',        color: '#f59e0b', href: "/daydream/game" },
  { id: 'scores',     emoji: '🏆', label: 'Leaderboard',  desc: 'Your personal bests',           color: '#c8981a', href: "/daydream/game" },
];

/**
 * Games Daydream page.
 *
 * Side A: GamesHub — the canonical games hub component (reclassified from
 *   the previous inline layout).  All live games are registered here.
 * Side B: GameEngin — the control layer for personal bests, leaderboard
 *   sharing, game launcher, and the GameRemote controller.
 *
 * Wiring: GamesHub ←→ GameEngin via DaydreamShell (flip with Alt+F or the
 * engine button).
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
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
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
            <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)' }}>Daydream</span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
          {/* Dr. Eams hero */}
          <div className="de-widget" style={{ background: 'linear-gradient(135deg, rgba(42,138,184,0.12), rgba(200,152,26,0.10))', borderColor: 'rgba(42,138,184,0.3)' }}>
            <div className="de-widget-header" style={{ borderBottomColor: 'rgba(42,138,184,0.2)' }}>
              <div className="flex items-center gap-2"><Star className="w-4 h-4" style={{ color: 'var(--de-gold)' }} /><span className="de-widget-title">Dr. Eams Platformer</span></div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,152,26,0.15)', color: 'var(--de-gold)', border: '1px solid rgba(200,152,26,0.3)' }}>✦ Live</span>
            </div>
            <div className="de-widget-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 72, height: 72, borderRadius: 18, flexShrink: 0, background: 'linear-gradient(135deg, rgba(42,138,184,0.2), rgba(200,152,26,0.18))', border: '1.5px solid rgba(42,138,184,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>∞</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 4 }}>Run. Jump. Dream.</div>
                  <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>Babylon.js 3-D side-scroller. 3 levels, enemies, coins, and a star. Move + jump always work together.</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {['3 Levels', 'Babylon.js 3D', 'PS5 Ready', 'Double Jump'].map(t => (
                      <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="de-widget-actions">
              <Link href="/daydream/game" className="de-btn de-btn-primary" style={{ gap: 8 }}><Play className="w-4 h-4 fill-current" /> Play Now</Link>
              <span style={{ fontSize: 11, color: 'var(--de-text-dim)', marginLeft: 'auto' }}><Zap className="w-3 h-3 inline mr-1" style={{ color: 'var(--de-gold)' }} />3 levels · Babylon.js 3D</span>
            </div>
          </div>

          <div className="de-widget" style={{ borderColor: 'rgba(42,138,184,0.24)' }}>
            <div className="de-widget-header">
              <Zap className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
              <span className="de-widget-title ml-2">Console-Class Game Plan</span>
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)' }}>
                Quality + Controls
              </span>
            </div>
            <div className="de-widget-body">
              <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.6, marginBottom: 12 }}>
                The target is simple: games that feel premium on mobile at home, with better control confidence, faster restarts, and deeper reasons to come back.
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {GAME_QUALITY_PILLARS.map((pillar) => (
                  <div
                    key={pillar.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(160,195,240,0.2)',
                    }}
                  >
                    <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--de-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{pillar.emphasis}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{pillar.title}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
                      {pillar.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="de-widget">
            <div className="de-widget-header"><span style={{ fontSize: 16, marginRight: 8 }}>📝</span><span className="de-widget-title">Word Sprint</span><span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)' }}>Live</span></div>
            <div className="de-widget-body"><WordSprint /></div>
          </div>

          <div className="de-widget">
            <div className="de-widget-header"><span style={{ fontSize: 16, marginRight: 8 }}>🧩</span><span className="de-widget-title">Memory Grid</span><span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)' }}>Live</span></div>
            <div className="de-widget-body"><MemoryGrid /></div>
          </div>

          <div className="de-widget">
            <div className="de-widget-header"><span style={{ fontSize: 16, marginRight: 8 }}>⚡</span><span className="de-widget-title">Speed Tap</span><span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)' }}>Live</span></div>
            <div className="de-widget-body"><SpeedTap /></div>
          </div>

          <div className="de-widget">
            <div className="de-widget-header">
              <Trophy className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
              <span className="de-widget-title ml-2">Leaderboards</span>
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,152,26,0.12)', color: 'var(--de-gold)', border: '1px solid rgba(200,152,26,0.25)' }}>Top 10</span>
            </div>
            <div className="de-widget-body space-y-5">
              {/* Dr. Eams Platformer */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: 14 }}>∞</span>
                  <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--de-text-dim)' }}>Dr. Eams Platformer</h3>
                </div>
                <Leaderboard game="platformer" />
              </section>

              <div style={{ height: 1, background: 'rgba(160,195,240,0.18)' }} />

              {/* Word Sprint */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: 14 }}>📝</span>
                  <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--de-text-dim)' }}>Word Sprint</h3>
                </div>
                <Leaderboard game="word-sprint" />
              </section>

              <div style={{ height: 1, background: 'rgba(160,195,240,0.18)' }} />

              {/* Memory Grid */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: 14 }}>🧩</span>
                  <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--de-text-dim)' }}>Memory Grid</h3>
                </div>
                <Leaderboard game="memory-grid" />
              </section>

              <div style={{ height: 1, background: 'rgba(160,195,240,0.18)' }} />

              {/* Speed Tap */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: 14 }}>⚡</span>
                  <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--de-text-dim)' }}>Speed Tap</h3>
                </div>
                <Leaderboard game="speed-tap" />
              </section>
            </div>
            <div className="de-widget-actions">
              <Link href="/daydream/game" className="de-btn de-btn-ghost text-xs">
                <Play className="w-3 h-3 fill-current" /> Play to rank up
              </Link>
            </div>
          </div>

          {/* All 23 Games Hub */}
          <div className="de-widget">
            <div className="de-widget-header">
              <Grid3x3 className="w-4 h-4" style={{ color: '#7c3aed' }} />
              <span className="de-widget-title ml-2">All Games</span>
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.25)' }}>
                23 Games
              </span>
            </div>
            <div className="de-widget-body">
              <GamesHub />
            </div>
          </div>
        </div>
      </div>
    </DaydreamShell>
  );
}
