'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { calibrateDevice, CalibrationSample } from '@/lib/dreamr/swipeCalibration';

// ── Gesture calibration state (mutable, never triggers re-renders) ────────────

interface CalibrationState {
  samples: CalibrationSample[];
  calibrated: boolean;
  activePointer: {
    id: number;
    startX: number;
    startY: number;
    startTime: number;
    lastX: number;
    lastY: number;
    maxDeviation: number;
    travelPx: number;
  } | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingHero() {
  const calibrationRef = useRef<CalibrationState>({
    samples: [],
    calibrated: false,
    activePointer: null,
  });

  useEffect(() => {
    const state = calibrationRef.current;

    function onPointerDown(e: PointerEvent) {
      if (state.calibrated) return;
      state.activePointer = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startTime: performance.now(),
        lastX: e.clientX,
        lastY: e.clientY,
        maxDeviation: 0,
        travelPx: 0,
      };
    }

    function onPointerMove(e: PointerEvent) {
      if (state.calibrated || !state.activePointer) return;
      if (e.pointerId !== state.activePointer.id) return;

      const dx = e.clientX - state.activePointer.lastX;
      const dy = e.clientY - state.activePointer.lastY;
      state.activePointer.travelPx += Math.sqrt(dx * dx + dy * dy);

      const devX = e.clientX - state.activePointer.startX;
      const devY = e.clientY - state.activePointer.startY;
      const deviation = Math.sqrt(devX * devX + devY * devY);
      state.activePointer.maxDeviation = Math.max(
        state.activePointer.maxDeviation,
        deviation,
      );

      state.activePointer.lastX = e.clientX;
      state.activePointer.lastY = e.clientY;
    }

    function onPointerUp(e: PointerEvent) {
      if (state.calibrated || !state.activePointer) return;
      if (e.pointerId !== state.activePointer.id) return;

      const durationMs = performance.now() - state.activePointer.startTime;
      const observedDeviationPx = state.activePointer.maxDeviation;
      const travelPx = state.activePointer.travelPx;

      state.samples.push({ observedDeviationPx, travelPx, durationMs });
      state.activePointer = null;

      if (state.samples.length >= 3) {
        calibrateDevice(state.samples);
        state.calibrated = true;
      }
    }

    addEventListener('pointerdown', onPointerDown);
    addEventListener('pointermove', onPointerMove);
    addEventListener('pointerup', onPointerUp);

    return () => {
      removeEventListener('pointerdown', onPointerDown);
      removeEventListener('pointermove', onPointerMove);
      removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  return (
    <section
      className="relative flex w-full min-h-[100svh] flex-col items-center justify-center px-6 py-20 text-center"
      aria-labelledby="hero-heading"
    >
      {/* Brand kicker */}
      <div
        className="de-kicker mb-6"
        style={{ color: '#d4a832' }}
        aria-label="DREAMengin — Creative OS"
      >
        Creative Operating Surface
      </div>

      {/* Headline */}
      <h1
        id="hero-heading"
        className="font-bold tracking-tight leading-[1.04] mb-5 max-w-4xl"
        style={{
          fontSize: 'clamp(2.6rem, 6.5vw, 5rem)',
          color: 'rgba(220,235,255,0.97)',
        }}
      >
        Space to{' '}
        <span
          style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 40%, #c8981a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          dream
        </span>
        .
      </h1>

      {/* Product statement */}
      <p
        className="text-base md:text-lg leading-relaxed mb-6 max-w-md"
        style={{ color: 'rgba(165,195,235,0.78)' }}
      >
        A privacy-first creative browser based OS. Your world — your rules, your dreams, and
        entirely yours.
      </p>

      {/* Mission statement link (replaces old stats strip) */}
      <Link
        href="/mission"
        className="mb-10 text-sm font-medium"
        style={{ color: 'rgba(165,195,235,0.60)' }}
      >
        A social platform where your individuality is the algorithm.{' '}
        <span style={{ color: '#38bdf8' }}>Where creativity—not likes—gets you seen. →</span>
      </Link>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-none justify-center">
        <Link
          href="/join"
          className="w-full sm:w-auto font-semibold rounded-full text-white text-center"
          style={{
            padding: '14px 32px',
            fontSize: '0.975rem',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            boxShadow: '0 6px 28px rgba(245,158,11,0.40)',
            letterSpacing: '0.01em',
            textDecoration: 'none',
          }}
        >
          Sign Up and start dreaming again!
        </Link>
        <Link
          href="/login"
          className="w-full sm:w-auto font-medium rounded-full text-center"
          style={{
            padding: '14px 32px',
            fontSize: '0.975rem',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(200,220,255,0.88)',
            letterSpacing: '0.01em',
            textDecoration: 'none',
          }}
        >
          Welcome Back!
        </Link>
      </div>
    </section>
  );
}
