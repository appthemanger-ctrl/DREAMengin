'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import HeroSprite from './HeroSprite';
import PlatformBadge from './ui/PlatformBadge';
import PortfolioOptimizationScene from './dreamengin/PortfolioOptimizationScene';

/** Social icons shown in the landing strip — using new SVG icons */
const STRIP_ICONS: Array<{ name: string; label: string }> = [
  { name: 'file',   label: 'Documents' },
  { name: 'globe',  label: 'Web' },
  { name: 'window', label: 'Apps' },
];

// ── Dark sci-fi colour tokens ──────────────────────────────────────────────
const C = {
  bg:           '#020810',
  panel:        'rgba(0, 18, 42, 0.78)',
  border:       'rgba(0, 229, 255, 0.22)',
  borderGold:   'rgba(255, 230, 0, 0.22)',
  cyan:         '#00E5FF',
  yellow:       '#FFE600',
  white:        'rgba(255,255,255,0.92)',
  dim:          'rgba(255,255,255,0.46)',
  glow:         '0 0 18px rgba(0,229,255,0.18)',
  glowStrong:   '0 0 32px rgba(0,229,255,0.28)',
  scanLine:     'rgba(0,229,255,0.04)',
} as const;

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
  const [fadeIn, setFadeIn] = useState(true);

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
    const FADE_MS   = 220;
    const interval  = setInterval(() => {
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
    ? '\ud83d\udc9c Happy Valentine\u2019s Day Dreamer \ud83c\udf39'
    : messages[msgIndex];

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ background: C.bg }}
    >

      {/* ── 1. Animated node-graph background — dark canvas ── */}
      <PortfolioOptimizationScene />

      {/* ── 2. Sci-fi dark overlay — vignette + subtle cyan tint ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(0,40,80,0.55) 0%, rgba(2,8,16,0.72) 70%, rgba(1,4,10,0.90) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── 3. Horizontal scan lines — subtle PBR UV grid feeling ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            `repeating-linear-gradient(0deg, transparent, transparent 3px, ${C.scanLine} 3px, ${C.scanLine} 4px)`,
          opacity: 0.45,
        }}
        aria-hidden="true"
      />

      {/* ── 4. Content ── */}
      <div
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8"
      >

        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <div
            className="text-lg font-bold tracking-widest uppercase"
            style={{
              color: C.cyan,
              textShadow: `0 0 12px ${C.cyan}`,
              letterSpacing: '0.22em',
            }}
          >
            DREAMengin
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              className="de-btn de-btn-ghost"
              style={{
                padding: '8px 18px', fontSize: 13,
                color: C.white, borderColor: C.border,
                background: C.panel,
              }}
            >
              About
            </Link>
            <Link
              href="/login"
              className="de-btn"
              style={{
                padding: '8px 18px', fontSize: 13,
                background: 'rgba(0,229,255,0.12)',
                border: `1px solid ${C.border}`,
                color: C.cyan,
                boxShadow: C.glow,
              }}
            >
              Sign In
            </Link>
          </div>
        </header>

        {/* ── Hero section ── */}
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">

          {/* Top pill — PBR material label style */}
          <div
            className="rounded-full px-4 py-2 text-sm backdrop-blur-sm"
            style={{
              border: `1px solid ${C.border}`,
              background: C.panel,
              color: C.cyan,
              boxShadow: C.glow,
              letterSpacing: '0.06em',
            }}
          >
            <span style={{ color: C.yellow }}>∞</span>
            {' '}Dr. Eams dreams of dreaming. You don't have to.{' '}
            <span style={{ color: C.cyan }}>∞</span>
          </div>

          {/* ── Character + speech bubble ── */}
          <div className="relative flex flex-col items-center">

            {/* Dr. Eams sci-fi title — above character on mobile, left on desktop */}
            <div
              className="sm:absolute sm:top-[20px] sm:left-[-120px] mb-4 sm:mb-0 z-20"
              style={{ textAlign: 'right' }}
            >
              <div
                style={{
                  fontFamily: '"Arial Black","Helvetica Neue",Impact,"Franklin Gothic Medium",sans-serif',
                  fontWeight: 900,
                  fontSize: 28,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                  textShadow: `0 0 20px ${C.cyan}, 0 0 40px rgba(0,229,255,0.4)`,
                  lineHeight: 1.1,
                }}
              >
                Dr Eams
              </div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.28em',
                  color: C.cyan,
                  textTransform: 'uppercase',
                  marginTop: 4,
                  opacity: 0.75,
                }}
              >
                PBR · Sci-Fi · v2
              </div>
            </div>

            {/* Speech bubble — dark glass sci-fi style */}
            <div
              className="sm:absolute sm:top-[64px] sm:right-[-84px] mb-3 sm:mb-0 max-w-[260px] sm:max-w-[280px] text-center sm:text-left z-20"
            >
              <div
                className="relative rounded-2xl px-4 py-3 backdrop-blur-sm"
                style={{
                  border: `1.5px solid ${C.border}`,
                  background: C.panel,
                  boxShadow: C.glowStrong,
                }}
              >
                <div
                  className={[
                    'text-sm font-medium leading-snug transition-opacity duration-200',
                    fadeIn ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                  style={{ color: C.white }}
                >
                  {bubbleText}
                </div>

                {/* Bubble tail — bottom-center on mobile */}
                <div
                  className="sm:hidden absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                  style={{
                    background: 'rgba(0,18,42,0.78)',
                    borderRight: `1.5px solid ${C.border}`,
                    borderBottom: `1.5px solid ${C.border}`,
                  }}
                />
                {/* Bubble tail — left-side on desktop */}
                <div
                  className="hidden sm:block absolute left-[-6px] top-[22px] w-3 h-3 rotate-45"
                  style={{
                    background: 'rgba(0,18,42,0.78)',
                    borderLeft: `1.5px solid ${C.border}`,
                    borderBottom: `1.5px solid ${C.border}`,
                  }}
                />
              </div>
            </div>

            {/* Character — full PBR sprite with touch interaction */}
            <HeroSprite
              width={spriteSize}
              height={spriteSize}
            />

            {/* Touch affordance */}
            <p
              className="mt-2 text-xs font-medium select-none tracking-widest uppercase"
              style={{
                color: C.cyan,
                textShadow: `0 0 8px ${C.cyan}`,
                opacity: 0.75,
              }}
            >
              tap to interact ✦
            </p>
          </div>

          {/* ── Headline — yellow → white → cyan gradient ── */}
          <h1
            className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl"
            style={{
              background: `linear-gradient(135deg, ${C.yellow} 0%, #FFFFFF 42%, ${C.cyan} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
            }}
          >
            Navigate your digital world as layered dreams.
          </h1>

          {/* ── Platform stats strip — dark glass pills ── */}
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
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
                style={{
                  border: `1px solid ${C.border}`,
                  background: C.panel,
                  color: C.white,
                  boxShadow: C.glow,
                }}
              >
                <span aria-hidden="true">{icon}</span>
                <span style={{ color: C.cyan, fontWeight: 800 }}>{value}</span>
                <span style={{ color: C.dim }}>{label}</span>
              </div>
            ))}
          </div>

          {/* ── CTAs ── */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Cyan primary */}
            <Link
              href="/join"
              className="de-btn"
              style={{
                padding: '12px 28px', fontSize: 15,
                background: 'rgba(0,229,255,0.14)',
                border: `1.5px solid ${C.cyan}`,
                color: C.cyan,
                boxShadow: C.glowStrong,
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            >
              Get Started
            </Link>
            <Link
              href="/about"
              className="de-btn"
              style={{
                padding: '12px 28px', fontSize: 15,
                background: C.panel,
                border: `1.5px solid ${C.border}`,
                color: C.white,
              }}
            >
              About
            </Link>
          </div>
        </section>

        {/* ── Icon strip ── */}
        <section className="w-full max-w-3xl mx-auto px-4 pb-10 text-center">
          <p
            className="text-xs font-semibold tracking-[0.22em] uppercase mb-4"
            style={{ color: C.dim }}
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
    </main>
  );
}
