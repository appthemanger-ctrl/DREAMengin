import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Trophy, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Games Daydream – DREAMengin', description: 'Play, challenge, and compete.' };

export default async function GamesDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const games = [
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
          <Gamepad2 className="w-5 h-5" style={{ color: '#10b981' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Games</h1>
          <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>Daydream</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Library tiles */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Game Library</span>
          </div>
          <div className="de-widget-body space-y-2">
            {games.map((g) => (
              <div key={g.title} className="de-row">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {g.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{g.title}</div>
                  <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{g.genre} · {g.players} players</div>
                </div>
                <button type="button" className="de-btn de-btn-primary text-xs" style={{ padding: '6px 14px' }}>Play</button>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Leaderboard</span>
            <Trophy className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
          </div>
          <div className="de-widget-body flex flex-col items-center py-4 gap-2">
            <Trophy className="w-8 h-8 opacity-20" style={{ color: 'var(--de-gold)' }} />
            <p className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Play a game to appear on the leaderboard</p>
          </div>
        </div>

        {/* Trending */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Trending</span></div>
          <div className="de-widget-body">
            <div className="grid grid-cols-3 gap-3">
              {['Puzzle Rush', 'Word Duel', 'Tap Race'].map((t) => (
                <div key={t} className="de-surface flex flex-col items-center gap-1 p-3 text-center">
                  <Star className="w-4 h-4" style={{ color: 'var(--de-gold)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--de-heading)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
