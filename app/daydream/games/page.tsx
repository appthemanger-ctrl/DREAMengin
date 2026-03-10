import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Trophy, Star, Play, Zap } from 'lucide-react';
import WordSprint from '@/components/games/WordSprint';
import MemoryGrid from '@/components/games/MemoryGrid';
import SpeedTap from '@/components/games/SpeedTap';
import Leaderboard from '@/components/games/Leaderboard';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import GameEngin from '@/components/daydream/GameEngin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Games Daydream – DREAMengin', description: 'Play, challenge, and compete.' };

const WIDGETS: DaydreamWidget[] = [
  { id: 'platformer', emoji: '∞',  label: 'Dr. Eams',     desc: '3-level platformer, play now',  color: '#2a8ab8', href: '/game' },
  { id: 'sprint',     emoji: '📝', label: 'Word Sprint',  desc: '60-second typing challenge',    color: '#10b981', href: '/daydream/games' },
  { id: 'memory',     emoji: '🧩', label: 'Memory Grid',  desc: 'Flip cards, match all pairs',   color: '#6366f1', href: '/daydream/games' },
  { id: 'tap',        emoji: '⚡', label: 'Speed Tap',    desc: 'Tap as fast as you can',        color: '#f59e0b', href: '/daydream/games' },
  { id: 'scores',     emoji: '🏆', label: 'Leaderboard',  desc: 'Your personal bests',           color: '#c8981a', href: '/daydream/games' },
  { id: 'media',      emoji: '🎬', label: 'Media Vault',  desc: 'Save your gaming moments',      color: '#ec4899', href: '/daydream/media-vault' },
];

export default async function GamesDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Games"
      enginName="GameEngin"
      accentColor="#2a8ab8"
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
                  <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>3 levels, enemies, coins, and a star. Touch, keyboard, or PS5 — works right now.</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {['3 Levels', 'Touch', 'PS5 Ready', 'Double Jump'].map(t => (
                      <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="de-widget-actions">
              <Link href="/game" className="de-btn de-btn-primary" style={{ gap: 8 }}><Play className="w-4 h-4 fill-current" /> Play Now</Link>
              <span style={{ fontSize: 11, color: 'var(--de-text-dim)', marginLeft: 'auto' }}><Zap className="w-3 h-3 inline mr-1" style={{ color: 'var(--de-gold)' }} />3 levels · dual joystick</span>
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
              <Link href="/game" className="de-btn de-btn-ghost text-xs">
                <Play className="w-3 h-3 fill-current" /> Play to rank up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DaydreamShell>
  );
}
