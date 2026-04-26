'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

/**
 * LandingHeroRobot — lazy wrapper around the Babylon.js Dr. Eams hero.
 *
 * The 3D robot is heavy (Babylon engine + ~1600-line procedural mesh script).
 * Loading it eagerly blocks the first paint, which on a phone makes the
 * starfield show up *after* the robot — the wrong order. Wrapping with
 * next/dynamic({ ssr: false }) defers the hero until after hydration, so the
 * starfield can render on the very first frame.
 */
const DrEamsBabylonHero = dynamic(
  () => import('@/components/landing/dream.DrEamsBabylonHero'),
  { ssr: false, loading: () => null },
);

// Slightly inset glow keeps the aura behind Dr. Eams instead of washing out the frame.
const GLOW_SIZE_RATIO = 0.94;
// Slow enough to feel ambient, not like a loading spinner.
const ORBIT_DURATION_SECONDS = 7;

export default function LandingHeroRobot() {
  const [size, setSize] = useState(300);

  useEffect(() => {
    const update = () =>
      setSize(window.innerWidth < 768 ? 300 : window.innerWidth < 1280 ? 400 : 460);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      className="relative flex flex-col items-center justify-center lg:flex-1 lg:max-w-[48%]"
      style={{ minHeight: size + 104 }}
    >
      <div
        className="pointer-events-none absolute rounded-full blur-3xl"
        style={{
          width: size * GLOW_SIZE_RATIO,
          height: size * GLOW_SIZE_RATIO,
          background: 'radial-gradient(circle, rgba(56,189,248,0.24) 0%, rgba(200,152,26,0.15) 42%, transparent 72%)',
        }}
        aria-hidden="true"
      />
      <div
        className="relative rounded-[2rem] border p-3 shadow-2xl backdrop-blur-md md:p-4"
        style={{
          borderColor: 'rgba(140,170,220,0.18)',
          background: 'linear-gradient(145deg, rgba(6,12,24,0.48), rgba(12,22,42,0.22))',
          boxShadow: '0 0 60px rgba(56,189,248,0.14), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div className="pointer-events-none absolute inset-3 rounded-[1.6rem] border border-cyan-200/10" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -inset-5 rounded-full border border-[#c8981a]/20"
          style={{ animation: `landing-robot-orbit ${ORBIT_DURATION_SECONDS}s linear infinite` }}
          aria-hidden="true"
        />
        <DrEamsBabylonHero width={size} height={size} />
      </div>
      <div
        className="relative -mt-5 flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md"
        style={{
          color: '#e8d090',
          borderColor: 'rgba(200,152,26,0.28)',
          background: 'linear-gradient(90deg, rgba(6,12,24,0.84), rgba(20,38,68,0.72))',
        }}
      >
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
        Dr. Eams online
      </div>
      <p
        className="mt-2 text-xs font-semibold select-none tracking-widest uppercase"
        style={{ color: 'rgba(200,152,26,0.70)', letterSpacing: '0.14em' }}
      >
        tap to wake ✦
      </p>
      <style jsx>{`
        @keyframes landing-robot-orbit {
          from { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.025); }
          to { transform: rotate(360deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
