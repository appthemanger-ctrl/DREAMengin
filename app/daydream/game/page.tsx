// app/daydream/game/page.tsx
// Dream Runner — Babylon.js 3-D side-scrolling platformer.
// Auth-gated: requires sign-in.

import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Gamepad2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ImmersiveGameShell from './ImmersiveGameShell';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'MADMAXI – DREAMengin',
  description: 'Immersive DREAMENGIN boot into the Babylon.js 3-D MADMAXI side-scroller.',
};

export default async function GamePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(42,138,184,0.18), rgba(5,10,20,0.98) 42%), linear-gradient(180deg, #040915, #02040b)' }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(3,8,18,0.84)', borderBottom: '1px solid rgba(125,211,252,0.18)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/daydream/games"
            className="p-2 -ml-2 rounded-full"
            style={{ background: 'rgba(125,211,252,0.1)' }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: '#f8fbff' }} />
          </Link>
          <Gamepad2 className="w-5 h-5" style={{ color: '#7dd3fc' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'rgba(226,232,240,0.56)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
              Games Daydream
            </div>
            <h1 className="text-base font-bold" style={{ color: '#f8fbff', lineHeight: 1 }}>
              MADMAXI
            </h1>
          </div>
          <span
            className="text-xs px-2 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(125,211,252,0.1)', color: '#7dd3fc', border: '1px solid rgba(125,211,252,0.2)' }}
          >
            Immersive Boot
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* ── Title ── */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(125,211,252,0.08)', color: '#7dd3fc', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 700, border: '1px solid rgba(125,211,252,0.18)', marginBottom: 12 }}>
            <Gamepad2 size={12} /> DREAMengin Arcade
          </div>
          <h2 style={{ fontSize: 30, fontWeight: 900, color: '#f8fbff', marginBottom: 8, lineHeight: 1.05 }}>
            DREAMENGIN
            <br />
            <span style={{ background: 'linear-gradient(135deg, #7dd3fc, #c8981a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MADMAXI
            </span>
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(226,232,240,0.72)', lineHeight: 1.7, maxWidth: 540, margin: '0 auto' }}>
            Boot into a darker, full-browser game session first, then hit the MADMAXI title screen like a console launch instead of a plain page load.
          </p>
        </div>

        {/* ── Game canvas ── */}
        <div style={{ marginBottom: 20 }}>
          <ImmersiveGameShell />
        </div>

        {/* ── Controls ── */}
        <div className="de-widget" style={{ padding: '14px 16px', background: 'rgba(9,16,30,0.82)', borderColor: 'rgba(125,211,252,0.18)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fbff', marginBottom: 12 }}>Controls</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {[
              { key: '← / A',         action: 'Move left' },
              { key: '→ / D',         action: 'Move right' },
              { key: '↑ / W / Space', action: 'Jump (double-jump)' },
              { key: 'Move + Jump',   action: 'Always work together' },
            ].map(({ key, action }) => (
              <div
                key={key}
                style={{
                  background: 'rgba(255,255,255,0.05)', borderRadius: 12,
                  padding: '10px 12px', border: '1px solid rgba(125,211,252,0.12)',
                }}
              >
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#7dd3fc', fontSize: 12, marginBottom: 3 }}>
                  {key}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.68)' }}>{action}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Back to games ── */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/daydream/games" className="de-btn de-btn-ghost text-sm" style={{ borderColor: 'rgba(125,211,252,0.18)', color: '#f8fbff' }}>
            ← Back to Games
          </Link>
        </div>
      </div>
    </div>
  );
}
