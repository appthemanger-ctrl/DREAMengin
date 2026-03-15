'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import DrEamsBabylonHero from '@/components/landing/DrEamsBabylonHero';

/**
 * LandingHero — Light blue · gold · white premium landing page.
 *
 * Design philosophy:
 *   3D environment  → platform identity  (DrEamsBabylonHero robot)
 *   2D interface    → precision interaction (flat, clean, exact)
 *   micro-motion    → polish (subtle easing, small transforms, short durations)
 *
 * Palette: light-blue bg · gold CTAs · white card surfaces · navy text
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

// Precision easing — smooth deceleration, no bounce
// CSS equivalents: --ease-decel / --ease-precise (see styles/globals.css)
const easeDecel   = { ease: [0, 0, 0.2, 1]    as const, duration: 0.3 };
const easePrecise = { ease: [0.4, 0, 0.2, 1]  as const, duration: 0.2 };

export default function LandingHero() {
  const [actionIdx, setActionIdx] = useState(0);
  const [heroSize, setHeroSize] = useState(480);

  useEffect(() => {
    const timer = setInterval(() => {
      setActionIdx((i) => (i + 1) % ACTIONS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const update = () => setHeroSize(window.innerWidth < 768 ? 340 : 480);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="relative min-h-dvh flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #f0f7ff 0%, #e4eff9 55%, #dce9f5 100%)' }}
    >

      {/* ── Ambient depth layers ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Soft sky-blue radial — top-left, platform warmth */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px]"
          style={{ background: 'radial-gradient(circle, rgba(125,211,252,0.22) 0%, transparent 68%)', filter: 'blur(40px)' }}
        />
        {/* Warm gold — bottom-right, aspirational */}
        <div className="absolute -bottom-24 -right-16 w-[440px] h-[440px]"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 68%)', filter: 'blur(48px)' }}
        />
        {/* White highlight — top-center, premium glass feel */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[180px]"
          style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 70%)' }}
        />
      </div>

      {/* ── Nav bar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeDecel, duration: 0.25 }}
        className="relative z-10 flex items-center justify-between px-5 py-4 md:px-8 md:py-5"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
        aria-label="Site navigation"
      >
        {/* Wordmark — deep navy on light bg */}
        <Link
          href="/"
          className="de-wordmark text-[#0f2a5c] text-xl tracking-tight select-none"
          aria-label="DREAMengin — home"
        >
          DREAMengin
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/about">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={easePrecise}
              className="premium-btn premium-btn-ghost-light text-sm px-4 py-2"
              style={{ cursor: 'pointer' }}
            >
              About
            </motion.span>
          </Link>
          <Link href="/login">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={easePrecise}
              className="premium-btn premium-btn-gold text-sm px-4 py-2"
              style={{ cursor: 'pointer' }}
            >
              Sign In
            </motion.span>
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero Content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 pt-8 pb-24 text-center md:pt-0">

        {/* Platform badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeDecel, delay: 0.1 }}
          className="mb-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(200,152,26,0.35)',
            color: '#9a6f0a',
            boxShadow: '0 1px 4px rgba(200,152,26,0.12)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" aria-hidden="true" />
          Your Creative OS
        </motion.div>

        {/* Headline */}
        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeDecel, delay: 0.18 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-4"
          style={{ color: '#0a1e3c' }}
        >
          Space to
          <br />
          <span className="relative inline-block">
            <AnimatePresence mode="wait">
              <motion.span
                key={actionIdx}
                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
                exit={{    opacity: 0, y: -14, filter: 'blur(6px)' }}
                transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
                className="inline-block bg-gradient-to-r from-[#0EA5E9] via-[#0369A1] to-[#B45309] bg-clip-text text-transparent"
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
          transition={{ ...easeDecel, delay: 0.26 }}
          className="text-base md:text-lg max-w-sm md:max-w-md leading-relaxed mb-10"
          style={{ color: 'rgba(15,42,92,0.58)' }}
        >
          A spatial, privacy-first creative operating surface. Navigate your digital world as layered dreams.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeDecel, delay: 0.32 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-none sm:justify-center"
        >
          <Link href="/join" className="w-full sm:w-auto">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={easePrecise}
              className="w-full premium-btn premium-btn-gold text-base px-8 py-3.5 font-semibold"
            >
              Get Started — Free
            </motion.button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={easePrecise}
              className="w-full premium-btn premium-btn-ghost-light text-base px-8 py-3.5"
            >
              Sign In
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="mt-12 flex items-center gap-6 md:gap-10 text-center"
          aria-label="Platform statistics"
        >
          {[
            { val: '6',   label: 'Dream Spaces' },
            { val: '20+', label: 'Games'         },
            { val: '25+', label: 'Integrations'  },
          ].map((s, i) => (
            <div key={s.val} className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold" style={{ color: '#0a1e3c' }}>{s.val}</span>
              <span className="text-xs tracking-wide" style={{ color: 'rgba(15,42,92,0.45)' }}>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Dr. Eams 3D Babylon.js robot ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeDecel, delay: 0.4, duration: 0.45 }}
        className="relative z-10 flex flex-col items-center justify-center pb-8 md:absolute md:bottom-0 md:right-0 md:pb-0 md:pr-4"
      >
        {/* Subtle glow behind the robot — gold + sky mix */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse 75% 55% at 50% 75%, rgba(125,211,252,0.2) 0%, rgba(245,158,11,0.06) 60%, transparent 80%)',
          }}
        />
        <DrEamsBabylonHero width={heroSize} height={heroSize} />
        <p
          className="mt-1 text-xs font-semibold select-none tracking-widest uppercase"
          style={{ color: 'rgba(200,152,26,0.75)', letterSpacing: '0.12em' }}
        >
          tap · drag · interact ✦
        </p>
      </motion.div>

    </div>
  );
}
