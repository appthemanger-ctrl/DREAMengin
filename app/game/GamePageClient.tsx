'use client';

// app/game/GamePageClient.tsx — client wrapper for DrEamsGameCanvas
// Dynamic import with ssr:false must live in a Client Component.

import dynamicImport from 'next/dynamic';

const DrEamsGameCanvas = dynamicImport(
  () => import('@/components/dreamengin/DrEamsGameCanvas'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 480,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(8,20,50,0.04)',
          borderRadius: 16,
        }}
      >
        <div style={{ color: 'var(--de-text-dim)', fontSize: 14, animation: 'pulse 1.5s ease-in-out infinite' }}>
          Loading Dr. Eams…
        </div>
      </div>
    ),
  }
);

export default function GamePageClient() {
  return <DrEamsGameCanvas />;
}
