import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Trophy, Star, Play, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Games Daydream – DREAMengin', description: 'Play, challenge, and compete.' };

export default async function GamesDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const comingSoon = [
    { title: 'Word Sprint',  genre: 'Word',   players: '1–4', icon: '📝' },
    { title: 'Memory Grid',  genre: 'Puzzle', players: '1',   icon: '🧩' },
    { title: 'Speed Tap',    genre: 'Arcade', players: '1–2', icon: '⚡' },
  ];

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Gamepad2 className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Games</h1>
          <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(42,138,184,0.12)', color: 'var(--de-accent)', border: '1px solid rgba(42,138,184,0.2)' }}>Daydream</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* ── Dr. Eams Platformer — Hero Card ── */}
        <div className="de-widget" style={{
          background: 'linear-gradient(135deg, rgba(42,138,184,0.12) 0%, rgba(200,152,26,0.10) 100%)',
          borderColor: 'rgba(42,138,184,0.3)',
        }}>
          <div className="de-widget-header" style={{ borderBottomColor: 'rgba(42,138,184,0.2)' }}>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
              <span className="de-widget-title">Featured</span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,152,26,0.15)', color: 'var(--de-gold)', border: '1px solid rgba(200,152,26,0.3)' }}>
              ✦ Live Now
            </span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Character badge */}
              <div style={{
                width: 72, height: 72, borderRadius: 18, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(42,138,184,0.2) 0%, rgba(200,152,26,0.18) 100%)',
                border: '1.5px solid rgba(42,138,184,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
              }}>∞</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 4 }}>Dr. Eams Platformer</div>
                <div style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
                  Run, jump, stomp enemies, collect coins, and reach the star — fully playable with touch, keyboard, or PS5 controller.
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {['3 Levels', 'Touch Controls', 'PS5 Ready', 'Double Jump'].map((tag) => (
                    <span key={tag} style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                      background: 'rgba(42,138,184,0.1)', color: 'var(--de-accent)',
                      border: '1px solid rgba(42,138,184,0.2)',
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="de-widget-actions">
            <Link href="/game" className="de-btn de-btn-primary" style={{ gap: 8 }}>
              <Play className="w-4 h-4 fill-current" /> Play Now
            </Link>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)', marginLeft: 'auto' }}>
              <Zap className="w-3 h-3 inline mr-1" style={{ color: 'var(--de-gold)' }} />
              3 levels · dual joystick
            </span>
          </div>
        </div>

        {/* ── Game Library (coming soon stubs) ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Game Library</span>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>More coming soon</span>
          </div>
          <div className="de-widget-body space-y-2">
            {comingSoon.map((g) => (
              <div key={g.title} className="de-row" style={{ opacity: 0.6 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(42,138,184,0.08)', border: '1px solid rgba(42,138,184,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {g.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{g.title}</div>
                  <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{g.genre} · {g.players} players</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(160,195,240,0.15)', color: 'var(--de-text-dim)', border: '1px solid rgba(160,195,240,0.25)' }}>
                  Soon
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Leaderboard ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Leaderboard</span>
            <Trophy className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
          </div>
          <div className="de-widget-body flex flex-col items-center py-4 gap-2">
            <Trophy className="w-8 h-8 opacity-20" style={{ color: 'var(--de-gold)' }} />
            <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Play Dr. Eams to appear on the leaderboard</p>
            <Link href="/game" className="de-btn de-btn-ghost text-xs">
              <Play className="w-3 h-3 fill-current" /> Start Playing
            </Link>
          </div>
        </div>

        {/* ── Trending ── */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Trending</span></div>
          <div className="de-widget-body">
            <div className="grid grid-cols-3 gap-3">
              {[{ name: 'Dr. Eams', href: '/game' }, { name: 'Word Duel', href: '#' }, { name: 'Tap Race', href: '#' }].map(({ name, href }) => (
                <Link key={name} href={href} className="de-surface flex flex-col items-center gap-1 p-3 text-center" style={href === '#' ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                  <Star className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--de-heading)' }}>{name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
