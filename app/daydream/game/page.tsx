// app/game/page.tsx
// Dr. Eams Platformer — 3-level platformer game
// Auth-gated: requires sign-in.

import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Gamepad2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import GamePageClient from './GamePageClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Dr. Eams Platformer – Dreamengin',
  description: 'Guide Dr. Eams through 3 dreamlike worlds.',
};

export default async function GamePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="de-sky-bg min-h-screen">
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/daydream/games"
            className="p-2 -ml-2 rounded-full"
            style={{ background: 'rgba(160,195,240,0.15)' }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Gamepad2 className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--de-text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
              Games Daydream
            </div>
            <h1 className="text-base font-bold" style={{ color: 'var(--de-heading)', lineHeight: 1 }}>
              Dr. Eams Platformer
            </h1>
          </div>
          <span
            className="text-xs px-2 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(200,152,26,0.15)', color: 'var(--de-gold)', border: '1px solid rgba(200,152,26,0.3)' }}
          >
            ∞ 3 Levels
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {/* ── Title ── */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(200,152,26,0.12)', color: 'var(--de-gold)',
              borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 700,
              border: '1px solid rgba(200,152,26,0.25)', marginBottom: 12,
            }}
          >
            <Gamepad2 size={12} /> DREAMengin Arcade
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 8, lineHeight: 1.1 }}>
            Guide{' '}
            <span style={{ background: 'linear-gradient(135deg, #4A90D9, #c8981a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dr. Eams
            </span>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--de-text-dim)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
            Navigate 3 dreamlike worlds. Collect Dream Coins, stomp enemies,
            and reach the golden ✦ star to advance.
          </p>
        </div>

        {/* ── Game canvas ── */}
        <div
          className="de-widget"
          style={{ padding: 16, marginBottom: 20, overflow: 'hidden' }}
        >
          <GamePageClient />
        </div>

        {/* ── Controls ── */}
        <div className="de-widget" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 12 }}>Controls</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {[
              { key: '← / A',         action: 'Move left' },
              { key: '→ / D',         action: 'Move right' },
              { key: '↑ / W / Space', action: 'Jump (×2 in air)' },
              { key: 'Jump on enemy', action: 'Stomp to defeat' },
            ].map(({ key, action }) => (
              <div
                key={key}
                style={{
                  background: 'rgba(255,255,255,0.7)', borderRadius: 12,
                  padding: '10px 12px', border: '1px solid rgba(160,195,240,0.2)',
                }}
              >
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--de-accent)', fontSize: 12, marginBottom: 3 }}>
                  {key}
                </div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{action}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Back to games ── */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/daydream/games" className="de-btn de-btn-ghost text-sm">
            ← Back to Games
          </Link>
        </div>
      </div>
    </div>
  );
}
