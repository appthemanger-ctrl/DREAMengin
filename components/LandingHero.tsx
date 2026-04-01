'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import DrEamsBabylonHero from '@/components/landing/DrEamsBabylonHero';
import ParticleConstellation from '@/components/landing/ParticleConstellation';

/**
 * LandingHero — Premium SICK redesign.
 *
 * Design philosophy (AXIOMS.md §Stylized + §Intuitive + §Cohesive + §Coherent):
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
  },
  {
    emoji: '🎮',
    title: 'Games Daydream',
    desc: '20+ arcade games, multiplayer rooms, GameEngin controls.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.18)',
  },
  {
    emoji: '💻',
    title: 'Code Daydream',
    desc: 'Live editor, CodeEngin runtime, shareable environments.',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.08)',
    border: 'rgba(14,165,233,0.18)',
  },
  {
    emoji: '🎨',
    title: 'Brand Daydream',
    desc: 'BrandingEngin + ContentEngin. Design your presence.',
    color: '#c8981a',
    bg: 'rgba(200,152,26,0.08)',
    border: 'rgba(200,152,26,0.22)',
  },
];

// Precision easing — smooth deceleration, no bounce
const easeDecel   = { ease: [0, 0, 0.2, 1]    as const, duration: 0.3 };
const easePrecise = { ease: [0.4, 0, 0.2, 1]  as const, duration: 0.2 };

export default function LandingHero() {
  const [actionIdx, setActionIdx] = useState(0);
  const [heroSize, setHeroSize] = useState(460);

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

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{ minHeight: '100dvh', background: 'linear-gradient(155deg, #070e1c 0%, #0c1829 40%, #0f2244 70%, #0a1628 100%)' }}
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
            background: 'radial-gradient(circle, rgba(200,152,26,0.13) 0%, rgba(245,158,11,0.05) 50%, transparent 70%)',
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
            className="mb-6 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.16em] uppercase select-none"
            style={{
              background: 'rgba(200,152,26,0.12)',
              border: '1px solid rgba(200,152,26,0.30)',
              color: '#d4a832',
            }}
            aria-label="DREAMengin — Creative OS"
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#F59E0B' }}
              aria-hidden="true"
            />
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
            A spatial, privacy-first creative OS. Six Daydream surfaces. Real AI tools. Your world — layered, connected, and entirely yours.
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
            tap · drag · interact ✦
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
          Six Daydream Surfaces
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58 + i * 0.06, duration: 0.35, ease: [0, 0, 0.2, 1] }}
              className="rounded-2xl p-4 flex flex-col gap-2"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
              }}
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
                className="text-xs leading-relaxed"
                style={{ color: 'rgba(140,170,220,0.60)' }}
              >
                {f.desc}
              </div>
              <div
                className="mt-1 h-0.5 rounded-full"
                style={{ background: f.color, opacity: 0.35, width: '40%' }}
                aria-hidden="true"
              />
            </motion.div>
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
              className="flex items-center gap-2 text-xs"
              style={{ color: 'rgba(140,170,220,0.45)' }}
            >
              <span aria-hidden="true" style={{ fontSize: 11 }}>{item.icon}</span>
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
