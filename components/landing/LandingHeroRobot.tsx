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
  () => import('@/components/landing/DrEamsBabylonHero'),
  { ssr: false, loading: () => null },
);

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
      style={{ minHeight: size + 60 }}
    >
      <DrEamsBabylonHero width={size} height={size} />
      <p
        className="mt-2 text-xs font-semibold select-none tracking-widest uppercase"
        style={{ color: 'rgba(200,152,26,0.70)', letterSpacing: '0.14em' }}
      >
        tap to wake ✦
      </p>
    </div>
  );
}
