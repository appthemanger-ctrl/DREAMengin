'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import DrEamsBabylonHero from './landing/DrEamsBabylonHero';
import PlatformBadge from './ui/PlatformBadge';
// PortfolioOptimizationScene was removed in Pass 2.
// It rendered stock/financial tickers (AAPL, MSFT, GOOG…) and a "QPO hub"
// node in the background — semantically misaligned with a creative OS product.
// Brand justification: AXIOMS.md Axiom 1 (Coherent), BUGS.md "Final Vision"
// (sky-blue + gold, no dark gamer/fintech aesthetics).
// The de-sky-bg gradient (sky → warm gold) is the correct sole background.

/**
 * LandingHero — root landing page hero component.
 *
 * Design system: de-sky-bg (sky-blue → warm gold), de-widget frosted glass,
 * de-btn-primary (blue → gold CTA), Space Grotesk font, design token CSS vars.
 * Animation: Framer Motion AnimatePresence for speech bubble transitions.
 * Architecture: ARCHITECTURE.md §8 (Gold = action, Light Blue = connected,
 *   White = base surface), THEME.md (no dark gamer colours, mobile-first polish).
 *
 * Pass 2 changes (Idari):
 *   - Removed PortfolioOptimizationScene (financial tickers brand mismatch).
 *   - Root element changed from <main> → <div>: layout.tsx already provides
 *     the page-level <main> landmark; nesting two <main> violates WCAG 1.3.6.
 *   - Added aria-live="polite" + aria-atomic on speech bubble for screen readers.
 *   - Logo text is now a <Link href="/"> — standard accessible brand-home pattern.
 *   - Secondary hero CTA changed "About" → "Sign In" (/login) so the two CTAs
 *     serve distinct user types (new vs returning), eliminating the duplicate
 *     /about link that was already present in the header nav.
 *   - Added aria-labelledby on hero section pointing to the h1.
 *   - Added aria-label on DrEamsBabylonHero wrapper for assistive tech.
 * Stats TODO: "20 Games" and "25+ Integrations" are not yet confirmed in
 *   FEATURE_STATUS.md — update when accurate figures are sourced.
 */

/** Platform icons shown in the connection strip */
const STRIP_ICONS: Array<{ name: string; label: string }> = [
  { name: 'file',   label: 'Documents' },
  { name: 'globe',  label: 'Web' },
  { name: 'window', label: 'Apps' },
];

/** CSS font-family shorthand honouring the Space Grotesk design token */
const FONT_SG = 'var(--font-space-grotesk, "Space Grotesk", system-ui, sans-serif)';

export default function LandingHero() {
  const messages = useMemo(
    () => [
      "hey… you were about to open that tab again, weren't you",
      "you paused there… deciding or pretending to decide",
      "you always scroll a little slower at night",
      "that idea you just had… yeah, keep that one",
      "you don't need to overthink this one",
      "you already know what you're gonna do",
      "you almost clicked something else just now",
      "you keep coming back to this for a reason",
      "it's fine… take your time",
      "just start… it's easier than you think",
    ],
    []
  );

  const isValentine = useMemo(() => {
    const d = new Date();
    return d.getMonth() === 1 && d.getDate() === 14;
  }, []);

  const [msgIndex, setMsgIndex] = useState(0);

  const [spriteSize, setSpriteSize] = useState(576);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = (e: MediaQueryListEvent | MediaQueryList) =>
      setSpriteSize(e.matches ? 448 : 576);
    update(mq);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isValentine) return;
    const ROTATE_MS = 8000;
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [isValentine, messages.length]);

  const bubbleText = isValentine
    ? '\ud83d\udc9c Happy Valentine\u2019s Day Dreamer \ud83c\udf39'
    : messages[msgIndex];

  return (
    // Root is a <div>, NOT <main> — layout.tsx already wraps every page in
    // <main role="main">.  Two nested <main> elements violate WCAG 1.3.6 and
    // the HTML spec (only one <main> landmark per document is allowed).
    <div
      className="de-sky-bg relative min-h-screen overflow-hidden"
    >

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">

        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          {/* Logo — Link to / so screen-reader users and keyboard users can
              always reach the root without hunting for a nav item. */}
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
            <Link
              href="/about"
              className="de-btn de-btn-ghost"
              style={{ padding: '8px 18px', fontSize: 13 }}
            >
              About
            </Link>
            <Link
              href="/login"
              className="de-btn de-btn-primary"
              style={{ padding: '8px 18px', fontSize: 13 }}
            >
              Sign In
            </Link>
          </nav>
        </header>

        {/* ── Hero section ── */}
        {/* aria-labelledby links this landmark to the visible h1 below */}
        <section
          className="flex flex-1 flex-col items-center justify-center gap-8 text-center"
          aria-labelledby="hero-heading"
        >

          {/* Top pill — brand signal */}
          <div
            className="de-widget rounded-full px-4 py-2 text-sm"
            style={{
              color: 'var(--de-text)',
              letterSpacing: '0.06em',
              fontFamily: FONT_SG,
            }}
          >
            <span style={{ color: 'var(--de-gold)' }}>∞</span>
            {' '}Dr. Eams dreams of dreaming. You don&apos;t have to.{' '}
            <span style={{ color: 'var(--de-blue)' }}>∞</span>
          </div>

          {/* ── Character + speech bubble ── */}
          <div className="relative flex flex-col items-center">

            {/* Dr. Eams title — above character on mobile, left on desktop */}
            <div
              className="sm:absolute sm:top-[20px] sm:left-[-120px] mb-4 sm:mb-0 z-20"
              style={{ textAlign: 'right' }}
            >
              <div
                style={{
                  fontFamily: FONT_SG,
                  fontWeight: 900,
                  fontSize: 28,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--de-heading)',
                  lineHeight: 1.1,
                }}
              >
                Dr. Eams
              </div>
              <div
                style={{
                  fontFamily: FONT_SG,
                  fontSize: 10,
                  letterSpacing: '0.28em',
                  color: 'var(--de-blue)',
                  textTransform: 'uppercase',
                  marginTop: 4,
                  opacity: 0.75,
                }}
              >
                Your AI guide
              </div>
            </div>

            {/* Speech bubble — frosted glass, Framer Motion transitions.
                aria-live="polite" + aria-atomic="true" ensures screen readers
                announce the new message each time it rotates without
                interrupting ongoing announcements. */}
            <div
              className="sm:absolute sm:top-[64px] sm:right-[-84px] mb-3 sm:mb-0 max-w-[260px] sm:max-w-[280px] text-center sm:text-left z-20"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="de-widget relative rounded-2xl px-4 py-3">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={bubbleText}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="text-sm font-medium leading-snug"
                    style={{ color: 'var(--de-text)', fontFamily: FONT_SG }}
                  >
                    {bubbleText}
                  </motion.p>
                </AnimatePresence>

                {/* Bubble tail — bottom-center on mobile */}
                <div
                  className="sm:hidden absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                  style={{
                    background: 'var(--de-glass)',
                    borderRight: '1.5px solid var(--de-border)',
                    borderBottom: '1.5px solid var(--de-border)',
                  }}
                  aria-hidden="true"
                />
                {/* Bubble tail — left-side on desktop */}
                <div
                  className="hidden sm:block absolute left-[-6px] top-[22px] w-3 h-3 rotate-45"
                  style={{
                    background: 'var(--de-glass)',
                    borderLeft: '1.5px solid var(--de-border)',
                    borderBottom: '1.5px solid var(--de-border)',
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Character — Babylon.js 3-D Dr. Eams with touch interaction.
                The wrapper div carries an aria-label so screen-reader users
                know this is an interactive 3-D character rather than an image. */}
            <div
              style={{
                width: spriteSize,
                height: spriteSize,
                position: 'relative',
                flexShrink: 0,
              }}
              aria-label="Dr. Eams — interactive 3-D character. Tap or drag to interact."
              role="img"
            >
              <DrEamsBabylonHero width={spriteSize} height={spriteSize} />
            </div>

            {/* Touch affordance */}
            <p
              className="mt-2 text-xs font-medium select-none tracking-widest uppercase"
              style={{
                fontFamily: FONT_SG,
                color: 'var(--de-blue)',
                opacity: 0.75,
              }}
            >
              tap · drag · interact ✦
            </p>
          </div>

          {/* ── Headline — sky-blue → navy → gold brand gradient ── */}
          <h1
            id="hero-heading"
            className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl"
            style={{
              fontFamily: FONT_SG,
              background:
                'linear-gradient(135deg, var(--de-blue) 0%, var(--de-heading) 42%, var(--de-gold) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Navigate your digital world as layered dreams.
          </h1>

          {/* ── Platform stats strip — frosted glass pills ──
              TODO: verify "20 Games" and "25+ Integrations" against
              FEATURE_STATUS.md once canonical figures are published.
              "3 AI Agents" (Dr. Eams, IDARi, TheBoogieMan) is confirmed. ── */}
          <div
            className="flex flex-wrap justify-center gap-3"
            aria-label="Platform statistics"
          >
            {[
              { value: '3',   label: 'AI Agents',   icon: '🤖' },
              { value: '20',  label: 'Games',        icon: '🎮' },
              { value: '25+', label: 'Integrations', icon: '🔗' },
              { value: 'v2',  label: 'Engine',       icon: '⚡' },
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

          {/* ── CTAs ──
              Primary:   "Get Started" → /join   (new users — sign up)
              Secondary: "Sign In"     → /login  (returning users)
              These two serve distinct user types, so there is no duplication.
              The header-nav "About" link already covers that destination. ── */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/join"
              className="de-btn de-btn-primary"
              style={{ padding: '12px 28px', fontSize: 15 }}
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="de-btn de-btn-ghost"
              style={{ padding: '12px 28px', fontSize: 15 }}
            >
              Sign In
            </Link>
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
