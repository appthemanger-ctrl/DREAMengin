'use client';

/**
 * DaydreamPulseStrip
 *
 * An animated "live Dream Surfaces" panel mounted inside WorkspaceDashboard.
 * Shows all 6 canonical Daydream surfaces as glowing frosted-glass orbs with
 * staggered CSS pulse rings, a golden sweep shimmer, and real surface navigation.
 *
 * Architecture justification:
 *   - docs/ARCHITECTURE.md §8  — Gold / light-blue / white premium palette.
 *   - docs/AXIOMS.md Axiom 4   — "Stylized — premium, intentional, designed."
 *   - docs/LAW.md Product law 3 — Every visible action does something real.
 *   - docs/ARCHITECTURE.md §10 — No runRenderLoop; all motion is CSS keyframes
 *                                (battery-safe, render-on-demand pattern).
 *   - docs/ARCHITECTURE.md §8  — framer-motion already in the bundle; using
 *                                `motion` for entrance stagger only.
 *
 * Performance: CSS @keyframes animations, no JS timers, no render loops.
 * The sweep shimmer and pulse rings are GPU-composited (transform + opacity only).
 */

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ── Canonical Daydream surface definitions (docs/ARCHITECTURE.md §1) ──────────

const DAYDREAMS = [
  {
    id: 'music',
    emoji: '🎵',
    label: 'Music',
    href: '/daydream/music',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.45)',
    delay: '0s',
  },
  {
    id: 'games',
    emoji: '🎮',
    label: 'Games',
    href: '/daydream/games',
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.45)',
    delay: '0.35s',
  },
  {
    id: 'lab',
    emoji: '⚗️',
    label: 'Lab',
    href: '/daydream/lab',
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.45)',
    delay: '0.70s',
  },
  {
    id: 'code',
    emoji: '💻',
    label: 'Code',
    href: '/daydream/code',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.45)',
    delay: '1.05s',
  },
  {
    id: 'brand',
    emoji: '🎨',
    label: 'Brand',
    href: '/daydream/brand',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.45)',
    delay: '1.40s',
  },
  {
    id: 'create',
    emoji: '✍️',
    label: 'Create',
    href: '/daydream/create',
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.45)',
    delay: '1.75s',
  },
] as const;

// ── Framer-motion entrance variants ───────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.065, delayChildren: 0.12 },
  },
};

const orbVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.88 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 380, damping: 28 },
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DaydreamPulseStrip() {
  const router = useRouter();

  return (
    <>
      {/* ── CSS keyframes — self-contained, no globals.css edit required ── */}
      <style>{`
        @keyframes de-pulse-ring {
          0%   { transform: scale(0.85); opacity: 0.65; }
          65%  { transform: scale(1.75); opacity: 0;    }
          100% { transform: scale(1.75); opacity: 0;    }
        }
        @keyframes de-sweep-shimmer {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(480%);  }
        }
        @keyframes de-live-blink {
          0%, 100% { opacity: 1;   }
          50%       { opacity: 0.3; }
        }
        .de-pulse-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          animation: de-pulse-ring 2.4s cubic-bezier(0.24,0.5,0.6,1) infinite;
          pointer-events: none;
          will-change: transform, opacity;
        }
        .de-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: de-live-blink 2s ease-in-out infinite;
          will-change: opacity;
          flex-shrink: 0;
        }
        .de-orb-tile {
          position: relative;
          width: 76px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          padding: 16px 8px 13px;
          border-radius: 22px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          user-select: none;
          overflow: hidden;
          border: 1.5px solid rgba(255,255,255,0.72);
          transition: box-shadow 0.22s cubic-bezier(0.34,1.56,0.64,1),
                      transform   0.16s cubic-bezier(0.34,1.56,0.64,1);
          /* GPU layer — avoids repaints on child animation */
          will-change: transform, box-shadow;
        }
        .de-orb-tile:active {
          transform: scale(0.94);
        }
        .de-strip-shimmer {
          position: absolute;
          top: 0; left: 0;
          width: 22%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.20) 40%,
            rgba(255,255,255,0.32) 50%,
            rgba(255,255,255,0.20) 60%,
            transparent 100%
          );
          transform: skewX(-12deg);
          animation: de-sweep-shimmer 5.5s ease-in-out infinite;
          pointer-events: none;
          will-change: transform;
        }
      `}</style>

      {/* ── Outer panel ── */}
      <div
        style={{
          position: 'relative',
          borderRadius: 24,
          background: 'rgba(255,255,255,0.76)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          border: '1.5px solid rgba(200,152,26,0.28)',
          boxShadow:
            '0 6px 32px rgba(0,0,0,0.09), 0 2px 10px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        {/* Sweep shimmer — GPU composited, CSS only, battery-safe */}
        <div className="de-strip-shimmer" aria-hidden="true" />

        {/* ── Panel header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 18px 10px',
            borderBottom: '1px solid rgba(200,152,26,0.12)',
          }}
        >
          {/* Gold ✦ accent icon */}
          <div
            aria-hidden="true"
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #c8981a, #e8b830)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              flexShrink: 0,
              boxShadow: '0 3px 10px rgba(200,152,26,0.38)',
            }}
          >
            ✦
          </div>

          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--de-heading)',
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
              }}
            >
              Dream Surfaces
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--de-text-dim)',
                fontWeight: 500,
                marginTop: 1,
              }}
            >
              6 live creative surfaces
            </div>
          </div>

          {/* Live badge — pulsing */}
          <div
            aria-label="All surfaces live"
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 100,
              background: 'rgba(34,197,94,0.10)',
              border: '1px solid rgba(34,197,94,0.25)',
              fontSize: 10,
              fontWeight: 700,
              color: '#16a34a',
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}
          >
            <div
              className="de-live-dot"
              style={{ background: '#22c55e' }}
              aria-hidden="true"
            />
            LIVE
          </div>
        </div>

        {/* ── Orbs strip ── */}
        <div
          data-scroll
          style={{
            display: 'flex',
            gap: 10,
            padding: '14px 16px 16px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', gap: 10 }}
          >
            {DAYDREAMS.map((d) => (
              <motion.div
                key={d.id}
                variants={orbVariants}
                // Hover lift — desktop only; mobile uses :active scale
                whileHover={{ y: -3, scale: 1.04, boxShadow: `0 12px 36px ${d.glow}` }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="de-orb-tile"
                style={{
                  background: `radial-gradient(ellipse at 30% 20%,
                    rgba(255,255,255,0.95) 0%,
                    ${d.color}18 60%,
                    ${d.color}08 100%)`,
                  boxShadow: `0 4px 18px ${d.glow.replace('0.45', '0.22')}, inset 0 1.5px 0 rgba(255,255,255,0.9)`,
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open ${d.label} Daydream Surface`}
                onClick={() => router.push(d.href)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(d.href);
                  }
                }}
              >
                {/* Pulse ring — CSS animation, unique delay per orb */}
                <div
                  className="de-pulse-ring"
                  aria-hidden="true"
                  style={{
                    background: `radial-gradient(circle, ${d.glow} 0%, transparent 70%)`,
                    animationDelay: d.delay,
                  }}
                />

                {/* Specular highlight — static, no animation */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '45%',
                    borderRadius: '20px 20px 55% 55% / 20px 20px 40% 40%',
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Emoji */}
                <div
                  aria-hidden="true"
                  style={{ fontSize: 30, lineHeight: 1, position: 'relative', zIndex: 1 }}
                >
                  {d.emoji}
                </div>

                {/* Label */}
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'var(--de-heading)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    position: 'relative',
                    zIndex: 1,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {d.label}
                </div>

                {/* Live dot — each orb's own color */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <div
                    className="de-live-dot"
                    style={{
                      background: d.color,
                      boxShadow: `0 0 5px ${d.glow}`,
                      animationDelay: d.delay,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ── Panel footer — ambient gradient bar ── */}
        <div
          aria-hidden="true"
          style={{
            height: 3,
            background: `linear-gradient(90deg,
              #8b5cf6 0%,
              #22c55e 17%,
              #06b6d4 33%,
              #3b82f6 50%,
              #f97316 67%,
              #ec4899 83%,
              #c8981a 100%
            )`,
            opacity: 0.55,
          }}
        />
      </div>
    </>
  );
}
