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
        className="landing-riso-robot relative rounded-[2rem] border p-3 shadow-2xl backdrop-blur-md md:p-4"
        style={{
          borderColor: 'rgba(215,166,42,0.28)',
          background:
            'linear-gradient(145deg, rgba(248,241,223,0.16), rgba(143,216,242,0.12) 46%, rgba(215,166,42,0.10))',
          boxShadow:
            '0 0 60px rgba(143,216,242,0.16), 0 0 34px rgba(215,166,42,0.12), inset 0 1px 0 rgba(248,241,223,0.18)',
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
        .landing-riso-robot::before,
        .landing-riso-robot::after {
          content: '';
          position: absolute;
          inset: 10px;
          border-radius: 1.5rem;
          pointer-events: none;
          z-index: 2;
        }
        .landing-riso-robot::before {
          background:
            radial-gradient(circle at 18% 20%, rgba(143,216,242,0.34) 0 1.2px, transparent 1.8px),
            radial-gradient(circle at 72% 64%, rgba(215,166,42,0.28) 0 1.1px, transparent 1.8px);
          background-size: 8px 8px, 10px 10px;
          mix-blend-mode: screen;
          opacity: 0.56;
        }
        .landing-riso-robot::after {
          background:
            linear-gradient(90deg, rgba(143,216,242,0.18), transparent 34%, rgba(215,166,42,0.16) 68%, transparent),
            repeating-linear-gradient(0deg, rgba(248,241,223,0.08) 0 1px, transparent 1px 4px);
          mix-blend-mode: overlay;
          opacity: 0.72;
        }
      `}</style>
    </div>
  );
}
