'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DrEamsBabylonHero from '@/components/landing/DrEamsBabylonHero';
import ParticleConstellation from '@/components/landing/ParticleConstellation';
import { calibrateDevice, type CalibrationSample } from '@/lib/dreamr/swipeCalibration';
import { createClient } from '@/lib/supabase/client';

/**
 * LandingHero — Premium SICK redesign.
 *
 * Design philosophy (AXIOMS.md §Synchronized + §Intuitive + §Cohesive + §Coherent):
 *   Deep navy→sky split bg  → platform depth and identity
 *   3D Dr. Eams robot       → interactive brand signature
 *   2D precision interface  → flat, clean, readable
 *   Gold / sky-blue palette → premium, aspirational, trustworthy
 *   Micro-motion            → purposeful, no decorative noise
 *
 * Palette: deep navy bg · sky blue accents · gold CTAs · white card surfaces
 * Architecture: ARCHITECTURE.md §8 (Design system direction)
 * Theme: THEME.md (Gold = action · Light blue = live · White = clarity)
 */

const ACTIONS = [
  'make music',
  'build dreams',
  'write code',
  'design brands',
  'create content',
  'play games',
  'own your feed',
  'share your work',
];

const FEATURES = [
  {
    emoji: '🎵',
    title: 'Music Daydream',
    desc: 'Record, share, and perform. StarMakerEngin powers your sound.',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.08)',
    border: 'rgba(236,72,153,0.18)',
    href: '/daydream/music',
  },
  {
    emoji: '🎮',
    title: 'Games Daydream',
    desc: '20+ arcade games, multiplayer rooms, GameEngin controls.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.18)',
    href: '/daydream/games',
  },
  {
    emoji: '💻',
    title: 'Code Daydream',
    desc: 'Live editor, CodeEngin runtime, shareable environments.',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.08)',
    border: 'rgba(14,165,233,0.18)',
    href: '/daydream/code',
  },
  {
    emoji: '🎨',
    title: 'Brand Daydream',
    desc: 'BrandingEngin + ContentEngin. Design your presence.',
    color: '#c8981a',
    bg: 'rgba(200,152,26,0.08)',
    border: 'rgba(200,152,26,0.22)',
    href: '/daydream/brand',
  },
  {
    emoji: '🔬',
    title: 'Lab Daydream',
    desc: 'Quantum circuits, data experiments, and deep visualizations.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.18)',
    href: '/daydream/lab',
  },
  {
    emoji: '✨',
    title: 'Create Daydream',
    desc: 'Content editor, publish queue, and scheduling calendar.',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.18)',
    href: '/daydream/create',
  },
  {
    emoji: '⚡',
    title: 'Forge Daydream',
    desc: 'Build and launch your creative projects end-to-end.',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.18)',
    href: '/daydream/forge',
  },
];

const PLATFORM_SIGNALS = [
  'System-wide glass shell',
  'Fast daydream switching',
  'Modern command posture',
];

const PLATFORM_STATS = [
  { value: '7', label: 'core daydreams' },
  { value: 'AI triad', label: 'always in reach' },
  { value: 'Dual runtime', label: 'persistent home system' },
];

// Precision easing — smooth deceleration, no bounce
const easeDecel   = { ease: [0, 0, 0.2, 1]    as const, duration: 0.3 };
const easePrecise = { ease: [0.4, 0, 0.2, 1]  as const, duration: 0.2 };

// ─── Per-gesture state for the on-arrival calibration pass ───────────────────
interface GestureState {
  /** Accumulated calibration samples from the current session. */
  samples: CalibrationSample[];
  /** True once calibrateDevice has been called with ≥3 samples. */
  calibrated: boolean;
  /** Pointer position + timestamp at the start of the current gesture. */
  gestureStart: { x: number; y: number; t: number } | null;
  /** Running list of pointer positions captured during the gesture. */
  positions: { x: number; y: number }[];
}

export default function LandingHero() {
  const router = useRouter();
  const [actionIdx, setActionIdx] = useState(0);
  const [heroSize, setHeroSize] = useState(460);

  // Redirect authenticated users to the home feed (client-side check so the
  // landing page renders immediately instead of waiting behind a loading spinner).
  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then((result: { data?: { user?: unknown } | null }) => {
      if (result.data?.user) {
        router.replace('/homedream');
      }
    }).catch(() => {});
  }, [router]);

  /** Mutable ref so the calibration effect never re-runs or causes re-renders. */
  const calibrationRef = useRef<GestureState>({
    samples: [],
    calibrated: false,
    gestureStart: null,
    positions: [],
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setActionIdx((i) => (i + 1) % ACTIONS.length);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const update = () =>
      setHeroSize(window.innerWidth < 768 ? 300 : window.innerWidth < 1280 ? 400 : 460);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /**
   * Humanity calibration pass — starts collecting samples from the very first
   * pointer interaction the user makes on the landing page.
   *
   * Each completed gesture (pointerdown → move sequence → pointerup) yields one
   * CalibrationSample that measures the device's natural perpendicular jitter.
   * After three samples calibrateDevice() locks in a device-specific profile that
   * makes verifyHumanity / resolveSwipeRelease accurate for this visitor's hardware.
   */
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

      // Discard micro-taps — need at least 5 px of travel to be meaningful.
      if (travelPx < 5) {
        state.gestureStart = null;
        state.positions = [];
        return;
      }

      // Max perpendicular deviation from the straight start→end line.
      let maxDevPx = 0;
      for (const p of state.positions) {
        const perpDist =
          Math.abs(dx * (start.y - p.y) - (start.x - p.x) * dy) / travelPx;
        if (perpDist > maxDevPx) maxDevPx = perpDist;
      }

      state.samples.push({
        observedDeviationPx: maxDevPx,
        travelPx,
        durationMs,
      });
      state.gestureStart = null;
      state.positions = [];

      // Three samples are sufficient to produce a stable device profile.
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
      style={{ minHeight: '100dvh', background: 'linear-gradient(155deg, #050505 0%, #080810 40%, #0a0f1e 70%, #050505 100%)' }}
    >
      {/* ── Atmospheric glow layers ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Primary sky-blue aurora — top-right */}
        <div
          className="absolute"
          style={{
            top: '-80px', right: '-60px',
            width: '660px', height: '660px',
            background: 'radial-gradient(circle, rgba(56,189,248,0.14) 0%, rgba(14,165,233,0.06) 45%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Gold warmth — bottom-left aspirational anchor */}
        <div
          className="absolute"
          style={{
            bottom: '-60px', left: '-40px',
            width: '540px', height: '540px',
            background: 'radial-gradient(circle, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.06) 50%, transparent 70%)',
            filter: 'blur(72px)',
          }}
        />
        {/* Deep navy center glow */}
        <div
          className="absolute"
          style={{
            top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '900px', height: '600px',
            background: 'radial-gradient(ellipse, rgba(30,80,180,0.10) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Subtle grid overlay for depth */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse 90% 70% at 50% 30%, black 0%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 30%, black 0%, transparent 80%)',
          }}
        />
        {/* Interactive particle constellation — responds to mouse */}
        <ParticleConstellation />
      </div>

      {/* ── Nav bar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeDecel, duration: 0.3 }}
        className="relative z-20 flex items-center justify-between px-6 md:px-10"
        style={{
          paddingTop: 'max(20px, env(safe-area-inset-top))',
          paddingBottom: 16,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(7,14,28,0.50)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        aria-label="Site navigation"
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="select-none flex items-baseline gap-0"
          aria-label="DREAMengin — home"
          style={{
            fontFamily: 'var(--font-cormorant, Georgia, serif)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 24,
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}
        >
          <span style={{
            background: 'linear-gradient(135deg, #e8d090 0%, #c8981a 60%, #a07820 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>dream</span>
          <span style={{ color: 'rgba(220,235,255,0.65)' }}>engin</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/about">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={easePrecise}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-full cursor-pointer"
              style={{
                color: 'rgba(200,220,255,0.72)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                letterSpacing: '0.01em',
              }}
            >
              About
            </motion.span>
          </Link>
          <Link href="/login">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={easePrecise}
              className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold rounded-full cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: 'white',
                boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
                letterSpacing: '0.01em',
              }}
            >
              Sign In
            </motion.span>
          </Link>
        </div>
      </motion.nav>

      {/* ── Main hero section — two columns on desktop ── */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between px-6 md:px-10 lg:px-16 pt-10 pb-10 lg:pt-0 lg:pb-0 gap-8 lg:gap-4">

        {/* ── Left column: text content ── */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:max-w-[52%] lg:py-16">

          {/* Brand pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...easeDecel, delay: 0.08 }}
            className="de-kicker mb-6"
            style={{
              color: '#d4a832',
            }}
            aria-label="DREAMengin — Creative OS"
          >
            Creative Operating Surface
          </motion.div>

          {/* Headline */}
          <motion.h1
            id="hero-heading"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...easeDecel, delay: 0.14 }}
            className="font-bold tracking-tight leading-[1.04] mb-5"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', color: 'rgba(220,235,255,0.97)' }}
          >
            Space to
            <br />
            <span
              className="relative inline-block"
              style={{ minWidth: 'max-content' }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={actionIdx}
                  initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
                  exit={{    opacity: 0, y: -16, filter: 'blur(8px)' }}
                  transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
                  className="inline-block"
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 40%, #c8981a 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {ACTIONS[actionIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...easeDecel, delay: 0.22 }}
            className="text-base md:text-lg leading-relaxed mb-8 max-w-md"
            style={{ color: 'rgba(165,195,235,0.72)' }}
          >
            A spatial, privacy-first creative OS. Seven Daydream surfaces. Real AI tools. Your world — layered, connected, and entirely yours.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...easeDecel, delay: 0.28 }}
            className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-none lg:justify-start"
          >
            <Link href="/join" className="w-full sm:w-auto">
              <motion.button
                type="button"
                whileHover={{ scale: 1.025, boxShadow: '0 10px 40px rgba(245,158,11,0.55)' }}
                whileTap={{ scale: 0.97 }}
                transition={easePrecise}
                className="w-full font-semibold rounded-full text-white"
                style={{
                  padding: '14px 32px',
                  fontSize: '0.975rem',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  boxShadow: '0 6px 28px rgba(245,158,11,0.40)',
                  letterSpacing: '0.01em',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Get Started — Free
              </motion.button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.97 }}
                transition={easePrecise}
                className="w-full font-medium rounded-full"
                style={{
                  padding: '14px 32px',
                  fontSize: '0.975rem',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(200,220,255,0.88)',
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                }}
              >
                Sign In
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...easeDecel, delay: 0.34 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
          >
            {PLATFORM_SIGNALS.map((signal) => (
              <span key={signal} className="de-command-chip" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(220,235,255,0.88)' }}>
                {signal}
              </span>
            ))}
          </motion.div>

          {/* Mission statement link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.48, duration: 0.45 }}
            className="mt-10 w-full max-w-2xl"
          >
            <Link
              href="/mission"
              className="group block rounded-3xl border px-5 py-4 transition-all duration-200 hover:shadow-[0_0_28px_rgba(232,208,144,0.12)] md:px-6 md:py-5"
              style={{
                borderColor: 'rgba(200,152,26,0.26)',
                background: 'linear-gradient(135deg, rgba(200,152,26,0.10) 0%, rgba(56,189,248,0.07) 100%)',
                boxShadow: '0 14px 40px rgba(7,14,28,0.24)',
              }}
              aria-label="Read the DREAMengin mission statement"
            >
              <span
                className="block text-lg font-semibold leading-relaxed underline decoration-transparent underline-offset-4 transition-all duration-200 group-hover:decoration-current md:text-xl lg:text-2xl"
                style={{
                  color: '#e8d090',
                  textShadow: '0 0 0 rgba(232,208,144,0)',
                }}
              >
                “A social platform where your individuality is the algorithm. Where creativity—not likes—gets you seen. →”
              </span>
              <span
                className="mt-2 block text-xs font-medium uppercase tracking-[0.18em] md:text-sm"
                style={{ color: 'rgba(140,170,220,0.72)' }}
              >
                Read the mission statement
              </span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...easeDecel, delay: 0.40 }}
            className="mt-6 grid w-full gap-3 md:grid-cols-3"
          >
            {PLATFORM_STATS.map((stat) => (
              <div key={stat.label} className="premium-card" style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(140,170,220,0.55)' }}>
                  {stat.label}
                </div>
                <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: 'rgba(235,245,255,0.96)' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right column: Dr. Eams robot ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...easeDecel, delay: 0.30, duration: 0.55 }}
          className="relative flex flex-col items-center justify-center lg:flex-1 lg:max-w-[48%]"
          style={{ minHeight: heroSize + 60 }}
        >
          {/* Robot glow halo */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 60%, rgba(56,189,248,0.16) 0%, rgba(200,152,26,0.05) 55%, transparent 75%)',
            }}
          />
          <DrEamsBabylonHero width={heroSize} height={heroSize} />
          <p
            className="mt-2 text-xs font-semibold select-none tracking-widest uppercase"
            style={{ color: 'rgba(200,152,26,0.70)', letterSpacing: '0.14em' }}
          >
            drag to orbit · tap to pulse ✦
          </p>
        </motion.div>
      </div>

      {/* ── Feature cards strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.45, ease: [0, 0, 0.2, 1] }}
        className="relative z-10 px-6 md:px-10 pb-10 md:pb-14"
        aria-label="Platform features"
      >
        {/* Section label */}
        <div
          className="mb-4 text-center text-xs font-bold tracking-[0.16em] uppercase"
          style={{ color: 'rgba(140,170,220,0.45)' }}
        >
          Seven Daydream Surfaces
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {FEATURES.map((f, i) => (
            <Link key={f.title} href={f.href} style={{ textDecoration: 'none' }}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.58 + i * 0.05, duration: 0.32, ease: [0, 0, 0.2, 1] }}
                className="rounded-2xl p-4 flex flex-col gap-2 h-full transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${f.border}`,
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  cursor: 'pointer',
                  minHeight: 120,
                }}
                whileHover={{
                  scale: 1.04,
                  borderColor: f.color,
                  boxShadow: `0 8px 32px ${f.bg}, 0 0 0 1px ${f.color}40`,
                  background: `rgba(255,255,255,0.065)`,
                }}
                whileTap={{ scale: 0.97 }}
              >
                <span
                  className="text-2xl"
                  role="img"
                  aria-label={f.title}
                >
                  {f.emoji}
                </span>
                <div
                  className="text-sm font-bold leading-tight"
                  style={{ color: 'rgba(210,230,255,0.90)' }}
                >
                  {f.title}
                </div>
                <div
                  className="text-xs leading-relaxed xl:hidden"
                  style={{ color: 'rgba(140,170,220,0.60)' }}
                >
                  {f.desc}
                </div>
                <div
                  className="mt-auto h-0.5 rounded-full"
                  style={{ background: f.color, opacity: 0.45, width: '40%' }}
                  aria-hidden="true"
                />
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Bottom trust line */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {[
            { icon: '🔒', text: 'Privacy-first by design' },
            { icon: '✦',  text: 'AI Triad: Dr. Eams · IDARi · BoogieMan' },
            { icon: '🌐', text: 'Built on Supabase + WebGPU' },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-2 text-xs select-none"
              style={{
                color: 'rgba(140,170,220,0.50)',
                padding: '4px 0',
                transition: 'color 0.15s',
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 12, filter: 'drop-shadow(0 0 4px rgba(200,152,26,0.2))' }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
          <Link
            href="/policy"
            className="flex items-center gap-1.5 text-xs"
            style={{
              color: 'rgba(140,170,220,0.55)',
              textDecoration: 'none',
              padding: '3px 10px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(6px)',
              transition: 'background 0.18s, color 0.18s',
            }}
          >
            Policy
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
