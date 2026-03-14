'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import DrEamsBabylonHero from './landing/DrEamsBabylonHero';
import PlatformBadge from './ui/PlatformBadge';

/**
 * LandingHero — root landing page hero component.
 *
 * Action-first design: headline → CTAs → character → platform context.
 * The page exists to get users to act (sign up or sign in).
 * Teaser surface — flexible, not over-structured.
 *
 * Design system: de-sky-bg (sky-blue → warm gold), de-widget frosted glass,
 * de-btn-primary (blue → gold CTA), Space Grotesk font, design token CSS vars.
 */

/** Platform icons shown in the connection strip */
const STRIP_ICONS: Array<{ name: string; label: string }> = [
  { name: 'file',   label: 'Documents' },
  { name: 'globe',  label: 'Web' },
  { name: 'window', label: 'Apps' },
];

/** CSS font-family shorthand honouring the Space Grotesk design token */
const FONT_SG = 'var(--font-space-grotesk, "Space Grotesk", system-ui, sans-serif)';

/** Dr. Eams sprite sizes — responsive breakpoints */
const SPRITE_SIZE_DESKTOP = 400;
const SPRITE_SIZE_MOBILE  = 300;

/** Short capability prompts — what users can DO with DREAMengin */
const ACTION_PROMPTS = [
  'make music',
  'build projects',
  'grow your brand',
  'play games',
  'write code',
  'create content',
  'own your feed',
  'share your work',
];

export default function LandingHero() {
  const isValentine = useMemo(() => {
    const d = new Date();
    return d.getMonth() === 1 && d.getDate() === 14;
  }, []);

  const [promptIndex, setPromptIndex] = useState(0);
  const [spriteSize, setSpriteSize] = useState(SPRITE_SIZE_DESKTOP);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = (e: MediaQueryListEvent | MediaQueryList) =>
      setSpriteSize(e.matches ? SPRITE_SIZE_MOBILE : SPRITE_SIZE_DESKTOP);
    update(mq);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isValentine) return;
    const timer = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % ACTION_PROMPTS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [isValentine]);

  return (
    // Root is a <div>, not <main> — layout.tsx already wraps pages in <main>.
    <div className="de-sky-bg relative min-h-screen overflow-hidden">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">

        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold tracking-widest uppercase"
            style={{
              fontFamily: FONT_SG,
              color: 'var(--de-heading)',
              letterSpacing: '0.22em',
              textDecoration: 'none',
            }}
            aria-label="DREAMengin — go to home"
          >
            DREAMengin
          </Link>
          <nav className="flex items-center gap-3" aria-label="Site navigation">
            <Link href="/about" className="de-btn de-btn-ghost" style={{ padding: '8px 18px', fontSize: 13 }}>
              About
            </Link>
            <Link href="/login" className="de-btn de-btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
              Sign In
            </Link>
          </nav>
        </header>

        {/* ── Hero section — action-first layout ── */}
        <section
          className="flex flex-1 flex-col items-center justify-center gap-8 text-center"
          aria-labelledby="hero-heading"
        >

          {/* ── Headline ── */}
          <h1
            id="hero-heading"
            className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl"
            style={{
              fontFamily: FONT_SG,
              background: 'linear-gradient(135deg, var(--de-blue) 0%, var(--de-heading) 42%, var(--de-gold) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Your creative operating surface.
          </h1>

          {/* ── Action cycling prompt ── */}
          <div
            className="flex items-center gap-2 text-base sm:text-lg"
            style={{ fontFamily: FONT_SG, color: 'var(--de-text)' }}
            aria-live="polite"
            aria-atomic="true"
          >
            <span style={{ color: 'var(--de-text-dim)' }}>A place to</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={isValentine ? 'valentine' : ACTION_PROMPTS[promptIndex]}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                style={{ color: 'var(--de-gold)', fontWeight: 700, minWidth: 140, textAlign: 'left', display: 'inline-block' }}
              >
                {isValentine ? '💜 dream together' : ACTION_PROMPTS[promptIndex]}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* ── Primary CTAs — action-first, above the fold ── */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/join"
              className="de-btn de-btn-primary"
              style={{ padding: '14px 36px', fontSize: 16, fontWeight: 700 }}
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="de-btn de-btn-ghost"
              style={{ padding: '14px 36px', fontSize: 16 }}
            >
              Sign In
            </Link>
          </div>

          {/* ── Dr. Eams character — secondary visual ── */}
          <div className="relative flex flex-col items-center">
            <div
              style={{ width: spriteSize, height: spriteSize, position: 'relative', flexShrink: 0 }}
              aria-label="Dr. Eams — interactive 3-D character. Tap or drag to interact."
              role="img"
            >
              <DrEamsBabylonHero width={spriteSize} height={spriteSize} />
            </div>
            <p
              className="mt-1 text-xs font-medium select-none tracking-widest uppercase"
              style={{ fontFamily: FONT_SG, color: 'var(--de-blue)', opacity: 0.65 }}
            >
              tap · drag · interact ✦
            </p>
          </div>

          {/* ── Platform context strip ── */}
          <div className="flex flex-wrap justify-center gap-3" aria-label="Platform capabilities">
            {[
              { value: '6',   label: 'Dream Spaces', icon: '✦' },
              { value: '20+', label: 'Games',         icon: '🎮' },
              { value: '25+', label: 'Integrations',  icon: '🔗' },
              { value: 'v2',  label: 'Engine',        icon: '⚡' },
            ].map(({ value, label, icon }) => (
              <div
                key={label}
                className="de-widget flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ fontFamily: FONT_SG }}
              >
                <span aria-hidden="true">{icon}</span>
                <span style={{ color: 'var(--de-blue)', fontWeight: 800 }}>{value}</span>
                <span style={{ color: 'var(--de-text-dim)' }}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Connection strip ── */}
        <section
          className="w-full max-w-3xl mx-auto px-4 pb-10 text-center"
          aria-label="Supported integrations"
        >
          <p
            className="text-xs font-semibold tracking-[0.22em] uppercase mb-4"
            style={{ color: 'var(--de-text-dim)', fontFamily: FONT_SG }}
          >
            Connect everything
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            {STRIP_ICONS.map(({ name, label }) => (
              <div
                key={name}
                aria-label={label}
                style={{ display: 'inline-block', opacity: 0.65 }}
                className="hover:opacity-100 transition-opacity duration-150"
              >
                <PlatformBadge name={name} size={44} label={label} />
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

