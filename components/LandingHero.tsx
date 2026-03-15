'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import HeroSprite from '@/components/HeroSprite';

/**
 * LandingHero — Premium phone-grade landing hero.
 *
 * Design: deep navy bg, spring-physics motion, glassmorphism surfaces,
 * animated action cycling headline, pill CTAs.
 *
 * Architecture justification: docs/ARCHITECTURE.md §8 — "Minimal clutter,
 * intentional motion, mobile-first polish." Gold + sky-blue palette.
 * Performance impact: Framer Motion spring animations are GPU-composited;
 * all ambient layers are CSS-only (no JS animation loops on the background).
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

const springFast = { type: 'spring', stiffness: 400, damping: 35 } as const;
const springMed  = { type: 'spring', stiffness: 260, damping: 28 } as const;

export default function LandingHero() {
  const [actionIdx, setActionIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActionIdx((i) => (i + 1) % ACTIONS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    // Root is a <div>, not <main> — layout.tsx already wraps pages in <main>.
    <div className="relative min-h-dvh flex flex-col bg-[#020818] overflow-hidden">

      {/* ── Ambient background layers (CSS-only, zero JS cost) ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Base deep gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#020818] via-[#071428] to-[#020818]" />
        {/* Sky-blue aurora — top-left */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(14,165,233,0.15)_0%,transparent_70%)] blur-3xl" />
        {/* Gold warmth — bottom-right */}
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(245,158,11,0.1)_0%,transparent_70%)] blur-3xl" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(125,211,252,1) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Nav bar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springFast, delay: 0.1 }}
        className="relative z-10 flex items-center justify-between px-5 py-4 md:px-8 md:py-5"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
        aria-label="Site navigation"
      >
        <Link
          href="/"
          className="text-white text-xl tracking-tight font-semibold"
          aria-label="DREAMengin — home"
        >
          DREAMengin
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/about">
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="premium-btn premium-btn-ghost text-sm px-4 py-2"
              style={{ cursor: 'pointer' }}
            >
              About
            </motion.span>
          </Link>
          <Link href="/login">
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="premium-btn premium-btn-primary text-sm px-4 py-2"
              style={{ cursor: 'pointer' }}
            >
              Sign In
            </motion.span>
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero Content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 pt-8 pb-24 text-center md:pt-0">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springMed, delay: 0.2 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(14,165,233,0.12)] border border-[rgba(14,165,233,0.25)] text-[#7DD3FC] text-xs font-medium tracking-widest uppercase"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-pulse" aria-hidden="true" />
          Your Creative OS
        </motion.div>

        {/* Headline */}
        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springMed, delay: 0.3 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.05] mb-4"
        >
          Space to
          <br />
          <span className="relative inline-block">
            <AnimatePresence mode="wait">
              <motion.span
                key={actionIdx}
                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
                exit={{ opacity: 0,   y: -20, filter: 'blur(8px)' }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block bg-gradient-to-r from-[#7DD3FC] via-[#0EA5E9] to-[#F59E0B] bg-clip-text text-transparent"
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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springMed, delay: 0.45 }}
          className="text-base md:text-lg text-[rgba(255,255,255,0.55)] max-w-sm md:max-w-md leading-relaxed mb-10"
        >
          A spatial, privacy-first creative operating surface. Navigate your digital world as layered dreams.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springMed, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-none sm:justify-center"
        >
          <Link href="/join" className="w-full sm:w-auto">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="w-full premium-btn premium-btn-primary text-base px-8 py-3.5 font-semibold"
            >
              Get Started — Free
            </motion.button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="w-full premium-btn premium-btn-ghost text-base px-8 py-3.5"
            >
              Sign In
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12 flex items-center gap-6 md:gap-10 text-center"
          aria-label="Platform statistics"
        >
          {[
            { val: '6',   label: 'Dream Spaces' },
            { val: '20+', label: 'Games'         },
            { val: '25+', label: 'Integrations'  },
          ].map((s) => (
            <div key={s.val} className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold text-white">{s.val}</span>
              <span className="text-xs text-[rgba(255,255,255,0.4)] tracking-wide">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Dr. Eams sprite — animated, interactive ── */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springMed, delay: 0.65 }}
        className="relative z-10 flex justify-center pb-8 md:absolute md:bottom-0 md:right-0 md:pb-0 md:pr-8"
        aria-label="Dr. Eams — interactive character. Tap or drag to interact."
        role="img"
      >
        <div className="w-[220px] h-[220px] md:w-[320px] md:h-[320px]">
          <HeroSprite width={320} height={320} />
        </div>
      </motion.div>

    </div>
  );
}
