'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import GalaxyStarfield from '@/components/landing/GalaxyStarfield';
import LandingNav from '@/components/landing/LandingNav';
import LandingProductStatement from '@/components/landing/LandingProductStatement';
import LandingHeroRobot from '@/components/landing/LandingHeroRobot';
import { calibrateDevice, type CalibrationSample } from '@/lib/dreamr/swipeCalibration';
import { createClient } from '@/lib/supabase/client';

/**
 * LandingHero — slim composition root for the public landing page.
 *
 * Layout order is deliberate so the persistent black background and the
 * MOND-2.1 GalaxyStarfield mount *first*, before the heavy Babylon.js hero
 * (which is dynamically imported in LandingHeroRobot). Each visual concern
 * lives in its own component under components/landing/.
 *
 * The pointer-calibration effect and mission-statement link block are kept
 * here intentionally — they are required by tests/landing-*.test.ts.
 */

interface GestureState {
  samples: CalibrationSample[];
  calibrated: boolean;
  gestureStart: { x: number; y: number; t: number } | null;
  positions: { x: number; y: number }[];
}

export default function LandingHero() {
  const router = useRouter();

  // Authenticated visitors skip the landing page.
  useEffect(() => {
    const supabase = createClient();
    void supabase.auth
      .getUser()
      .then((result: { data?: { user?: unknown } | null }) => {
        if (result.data?.user) router.replace('/homedream');
      })
      .catch(() => {});
  }, [router]);

  // ── Humanity calibration pass — keep wiring required by landing-calibration test ──
  const calibrationRef = useRef<GestureState>({
    samples: [],
    calibrated: false,
    gestureStart: null,
    positions: [],
  });

  useEffect(() => {
    const state = calibrationRef.current;

    function onPointerDown(e: PointerEvent) {
      if (state.calibrated) return;
      state.gestureStart = { x: e.clientX, y: e.clientY, t: Date.now() };
      state.positions = [{ x: e.clientX, y: e.clientY }];
    }

    function onPointerMove(e: PointerEvent) {
      if (state.calibrated || !state.gestureStart) return;
      state.positions.push({ x: e.clientX, y: e.clientY });
    }

    function onPointerUp(e: PointerEvent) {
      if (state.calibrated || !state.gestureStart || state.positions.length < 2) {
        state.gestureStart = null;
        state.positions = [];
        return;
      }
      const start = state.gestureStart;
      const durationMs = Math.max(1, Date.now() - start.t);
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const travelPx = Math.sqrt(dx * dx + dy * dy);
      if (travelPx < 5) {
        state.gestureStart = null;
        state.positions = [];
        return;
      }
      let maxDevPx = 0;
      for (const p of state.positions) {
        const perpDist =
          Math.abs(dx * (start.y - p.y) - (start.x - p.x) * dy) / travelPx;
        if (perpDist > maxDevPx) maxDevPx = perpDist;
      }
      state.samples.push({ observedDeviationPx: maxDevPx, travelPx, durationMs });
      state.gestureStart = null;
      state.positions = [];
      if (state.samples.length >= 3) {
        calibrateDevice(state.samples);
        state.calibrated = true;
      }
    }

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{ minHeight: '100dvh', background: '#000' }}
    >
      {/* Persistent simple black background + galaxy starfield */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <GalaxyStarfield />
      </div>

      <LandingNav />

      <main className="relative z-10 flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between px-6 md:px-10 lg:px-16 pt-10 pb-10 lg:pt-0 lg:pb-0 gap-8 lg:gap-4">
        <LandingProductStatement />
        <LandingHeroRobot />
      </main>

      {/* Mission statement — preserved for landing-mission-link test contract */}
      <div className="relative z-10 px-6 md:px-10 pb-10">
        <Link
          href="/mission"
          className="group block rounded-3xl border px-5 py-4 mx-auto max-w-2xl transition-all duration-200 hover:shadow-[0_0_28px_rgba(232,208,144,0.12)] md:px-6 md:py-5"
          style={{
            borderColor: 'rgba(200,152,26,0.26)',
            background:
              'linear-gradient(135deg, rgba(200,152,26,0.10) 0%, rgba(56,189,248,0.07) 100%)',
            textDecoration: 'none',
          }}
          aria-label="Read the DREAMengin mission statement"
        >
          <span
            className="block text-base md:text-lg font-semibold leading-relaxed"
            style={{ color: '#e8d090' }}
          >
            {'“A social platform where your individuality is the algorithm. Where creativity—not likes—gets you seen. →”'}
          </span>
          <span
            className="mt-2 block text-xs font-medium uppercase tracking-[0.18em]"
            style={{ color: 'rgba(140,170,220,0.72)' }}
          >
            Read the mission statement
          </span>
        </Link>
      </div>
    </div>
  );
}
