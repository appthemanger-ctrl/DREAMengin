// src/app/game/page.tsx
import { Gamepad2 } from 'lucide-react';
import Nav from '@/components/Nav';
import dynamic from 'next/dynamic';

// Load the canvas game client-side only (no SSR for Canvas2D)
const DrEamsGameCanvas = dynamic(
  () => import('@/components/dreamengin/DrEamsGameCanvas'),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center w-full" style={{ height: 480 }}>
      <div className="text-slate-400 text-sm animate-pulse">Loading Dr. Eams…</div>
    </div>
  )},
);

export default function GamePage() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 de-badge de-badge-gold mb-4">
            <Gamepad2 size={14} /> DREAMengin Arcade
          </div>
          <h1 className="text-4xl font-bold mb-3">
            <span className="de-gradient-text">Dr. Eams</span> — Dream Platformer
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Guide Dr. Eams through 3 dreamlike worlds. Collect Dream Coins,
            stomp enemies, and reach the golden ✦ star to advance.
          </p>
        </div>

        {/* Game canvas */}
        <div className="de-card p-4 md:p-6">
          <DrEamsGameCanvas />
        </div>

        {/* Controls card */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: '← / A',    action: 'Move left' },
            { key: '→ / D',    action: 'Move right' },
            { key: '↑ / W / Space', action: 'Jump (×2 in air)' },
            { key: 'Stomp',    action: 'Jump on enemies' },
          ].map(({ key, action }) => (
            <div key={key} className="de-card p-3 text-center">
              <div className="font-mono font-bold text-de-sky text-sm mb-1">{key}</div>
              <div className="text-xs text-slate-400">{action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
