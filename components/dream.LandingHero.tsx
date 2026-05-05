'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import UniverseField from '@/components/landing/dream.scene.UniverseField';
import LandingNav from '@/components/landing/dream.LandingNav';
import LandingProductStatement from '@/components/landing/dream.LandingProductStatement';
import { calibrateDevice, type CalibrationSample } from '@/lib/dreamr/swipeCalibration';

/**
 * LandingHero — slim composition root for the public landing page.
 *
 * Layout order is deliberate so the persistent black background and the
 * MOND-2.1 UniverseField mount first and stay visually dominant. Each visual
 * concern lives in its own component under components/landing/.
 *
 * The pointer-calibration effect and mission-statement link block are kept
 * here intentionally — they are required by tests/landing-*.test.ts.
 *
 * Authentication redirect lives in `app/page.tsx` (server-side) so that
 * logged-in users never download this page.
 */

interface GestureState {
  samples: CalibrationSample[];
  calibrated: boolean;
  gestureStart: { x: number; y: number; t: number } | null;
  positions: { x: number; y: number }[];
}

export default function LandingHero() {
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
      // Early-bail before any work to keep this listener cheap on every move
      // (it will fire across the entire viewport at ~60 Hz on a phone).
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

    // Passive listeners — calibration never preventDefaults. This keeps iOS
    // scroll perf intact when these handlers run on every viewport pointermove.
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener('pointerdown', onPointerDown, opts);
    window.addEventListener('pointermove', onPointerMove, opts);
    window.addEventListener('pointerup', onPointerUp, opts);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  return (
      <div
        className="relative flex flex-col overflow-hidden"
        style={{ minHeight: '100svh', background: '#000' }}
        data-route="landing"
      >
      {/* Persistent simple black background + galaxy starfield — base Newtonian physics */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <UniverseField scaled={false} />
      </div>

      <LandingNav />

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pt-10 pb-10 md:px-10 lg:px-16 lg:pt-0 lg:pb-0">
        <LandingProductStatement />
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
