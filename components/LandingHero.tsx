'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import HeroSprite from './HeroSprite';
import PlatformBadge from './ui/PlatformBadge';
import PortfolioOptimizationScene from './dreamengin/PortfolioOptimizationScene';

/** Social icons shown in the landing strip — top two rows of iconslist.png */
const STRIP_ICONS: Array<{ name: string; label: string; href: string }> = [
  { name: 'facebook',   label: 'Facebook',   href: '/connectors' },
  { name: 'twitter',    label: 'Twitter',    href: '/connectors' },
  { name: 'instagram',  label: 'Instagram',  href: '/connectors' },
  { name: 'linkedin',   label: 'LinkedIn',   href: '/connectors' },
  { name: 'youtube',    label: 'YouTube',    href: '/connectors' },
  { name: 'tiktok',     label: 'TikTok',     href: '/connectors' },
  { name: 'messenger',  label: 'Messenger',  href: '/connectors' },
  { name: 'discord',    label: 'Discord',    href: '/connectors' },
  { name: 'spotify',    label: 'Spotify',    href: '/connectors' },
  { name: 'snapchat',   label: 'Snapchat',   href: '/connectors' },
  { name: 'reddit',     label: 'Reddit',     href: '/connectors' },
  { name: 'whatsapp',   label: 'WhatsApp',   href: '/connectors' },
  { name: 'twitch',     label: 'Twitch',     href: '/connectors' },
  { name: 'pinterest',  label: 'Pinterest',  href: '/connectors' },
  { name: 'soundcloud', label: 'SoundCloud', href: '/connectors' },
  { name: 'dropbox',    label: 'Dropbox',    href: '/connectors' },
  { name: 'figma',      label: 'Figma',      href: '/connectors' },
  { name: 'medium',     label: 'Medium',     href: '/connectors' },
];

export default function LandingHero() {
  const messages = useMemo(
    () => [
      "hey… you were about to open that tab again, weren’t you",
      "you paused there… deciding or pretending to decide",
      "you always scroll a little slower at night",
      "that idea you just had… yeah, keep that one",
      "you don’t need to overthink this one",
      "you already know what you’re gonna do",
      "you almost clicked something else just now",
      "you keep coming back to this for a reason",
      "it’s fine… take your time",
      "just start… it’s easier than you think",
    ],
    []
  );

  const isValentine = useMemo(() => {
    const d = new Date();
    return d.getMonth() === 1 && d.getDate() === 14; // Feb = 1
  }, []);

  const [msgIndex, setMsgIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Responsive sprite size — 448 on mobile (<640 px), 576 on sm+ (2× original sizes).
  // Uses matchMedia so it only fires when crossing the 640 px breakpoint, not on every resize.
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
    const FADE_MS = 220;

    const interval = setInterval(() => {
      setFadeIn(false);
      const swap = setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % messages.length);
        setFadeIn(true);
      }, FADE_MS);

      return () => clearTimeout(swap);
    }, ROTATE_MS);

    return () => clearInterval(interval);
  }, [isValentine, messages.length]);

  const bubbleText = isValentine
    ? '\ud83d\udc9c Happy Valentine’s Day Dreamer \ud83c\udf39'
    : messages[msgIndex];

  /*
   * Layering (bottom to top):
   *  1. html/body sky-blue -> gold-cream gradient (globals.css :root — de-theme vars)
   *  2. PortfolioOptimizationScene canvas — animated node-graph
   *  3. Thin frosted-glass wash — keeps text crisp, lets animation glow through
   *  4. Content (z-10)
   *
   * <main> is transparent — the design-system body gradient is the base colour.
   * Matches SPEC.md §1.1 "sky, airy, frosted glass" and §1.2 colour tokens.
   * Fixes SPEC.md §9 violation: was using dark-gamer bg-[#070b16].
   */
  return (
    <main className="relative min-h-screen overflow-hidden">

      {/* 1. Portfolio Optimization canvas — animated node-graph background */}
      <PortfolioOptimizationScene />

      {/* 2. Frosted-glass wash — sky-blue fading to gold-cream, semi-transparent */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(170deg, rgba(220,232,248,0.68) 0%, rgba(213,226,245,0.62) 55%, rgba(245,232,196,0.45) 100%)',
        }}
        aria-hidden="true"
      />

      {/* 3. Content */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">

        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <div
            className="text-lg font-bold tracking-wide"
            style={{ color: 'var(--de-heading)' }}
          >
            DREAMengin
          </div>
          <div className="flex items-center gap-3">
            <Link href="/about" className="de-btn de-btn-ghost" style={{ padding: '8px 18px', fontSize: 13 }}>
              About
            </Link>
            <Link href="/login" className="de-btn de-btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
              Sign In
            </Link>
          </div>
        </header>

        {/* ── Hero section ── */}
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">

          {/* Top pill — sky-blue glass */}
          <div
            className="rounded-full px-4 py-2 text-sm backdrop-blur-sm"
            style={{
              border: '1px solid rgba(42,138,184,0.30)',
              background: 'rgba(255,255,255,0.60)',
              color: 'var(--de-text)',
            }}
          >
            Dr. Eams dreams of dreaming. You don’t have to.
          </div>

          {/* ── Character + speech bubble ── */}
          <div className="relative flex flex-col items-center">

            {/* Speech bubble — in document flow ABOVE sprite on mobile so it never overlaps;
                absolute to the left side on desktop (sm+). */}
            <div className="sm:absolute sm:top-[64px] sm:left-[-84px] mb-3 sm:mb-0 max-w-[260px] sm:max-w-[320px] text-center sm:text-right z-20">
              <div
                className="relative rounded-2xl px-4 py-3 backdrop-blur-sm"
                style={{
                  border: '1.5px solid rgba(42,138,184,0.25)',
                  background: 'rgba(255,255,255,0.75)',
                  boxShadow:
                    '0 4px 24px rgba(42,138,184,0.10), inset 0 -1px 0 rgba(200,152,26,0.12)',
                }}
              >
                <div
                  className={[
                    'text-sm font-medium leading-snug transition-opacity duration-200',
                    fadeIn ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                  style={{ color: 'var(--de-text)' }}
                >
                  {bubbleText}
                </div>

                {/* Bubble tail — bottom-center on mobile (points down toward sprite) */}
                <div
                  className="sm:hidden absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                  style={{
                    background: 'rgba(255,255,255,0.75)',
                    borderRight: '1.5px solid rgba(42,138,184,0.25)',
                    borderBottom: '1.5px solid rgba(42,138,184,0.25)',
                  }}
                />
                {/* Bubble tail — right-side on desktop (points right toward sprite) */}
                <div
                  className="hidden sm:block absolute right-[-6px] top-[22px] w-3 h-3 rotate-45"
                  style={{
                    background: 'rgba(255,255,255,0.75)',
                    borderRight: '1.5px solid rgba(42,138,184,0.25)',
                    borderTop: '1.5px solid rgba(42,138,184,0.25)',
                  }}
                />
              </div>
            </div>

            <HeroSprite
              width={spriteSize}
              height={spriteSize}
            />

            {/* Touch affordance — AXIOM 1: all actions must be instantly discoverable */}
            <p
              className="mt-2 text-xs font-medium select-none"
              style={{ color: 'var(--de-text-dim)' }}
            >
              tap to interact &#x2736;
            </p>
          </div>

          {/* ── Gold-gradient headline ── */}
          <h1
            className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl"
            style={{
              background:
                'linear-gradient(135deg, var(--de-heading) 0%, var(--de-accent) 42%, var(--de-gold) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Navigate your digital world as layered dreams.
          </h1>

          {/* ── Platform stats strip ── */}
          <div
            className="flex flex-wrap justify-center gap-3"
            aria-label="Platform statistics"
          >
            {[
              { value: '3',   label: 'AI Agents',         icon: '🤖' },
              { value: '20',  label: 'Games',              icon: '🎮' },
              { value: '25+', label: 'Integrations',       icon: '🔗' },
              { value: 'v2',  label: 'Engine',             icon: '⚡' },
              { value: '437', label: 'Tests Passing',      icon: '✅' },
            ].map(({ value, label, icon }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
                style={{
                  border: '1px solid rgba(42,138,184,0.22)',
                  background: 'rgba(255,255,255,0.55)',
                  color: 'var(--de-text)',
                }}
              >
                <span aria-hidden="true">{icon}</span>
                <span style={{ color: 'var(--de-accent)', fontWeight: 800 }}>{value}</span>
                <span style={{ color: 'var(--de-text-dim)' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* ── CTAs ── */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Gold pill — primary action */}
            <Link href="/join" className="de-btn de-btn-gold" style={{ padding: '12px 28px', fontSize: 15 }}>
              Get Started
            </Link>
            <Link href="/about" className="de-btn de-btn-ghost" style={{ padding: '12px 28px', fontSize: 15 }}>
              About
            </Link>
          </div>
        </section>

        {/* ── Icon strip: connect everything ── */}
        <section className="w-full max-w-3xl mx-auto px-4 pb-10 text-center">
          <p
            className="text-xs font-semibold tracking-[0.18em] uppercase mb-4"
            style={{ color: 'var(--de-text-dim)' }}
          >
            Connect everything
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            {STRIP_ICONS.map(({ name, label, href }) => (
              <Link
                key={name}
                href={href}
                aria-label={`Connect ${label}`}
                style={{ display: 'inline-block', outline: 'none' }}
                className="opacity-80 hover:opacity-100 focus-visible:ring-2 focus-visible:opacity-100 transition-opacity duration-150"
              >
                <PlatformBadge name={name} size={44} label={label} />
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
