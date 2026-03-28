'use client';

/**
 * KonamiDream — Global easter egg that activates HYPER DREAM MODE.
 *
 * Activation sequence: ↑ ↑ ↓ ↓ ← → ← → b a
 * On activation:
 *  1. Plays a quick screen flash sequence
 *  2. Shows a full-screen "HYPER DREAM MODE ACTIVATED" overlay
 *  3. Adds `body.hyper-dream` CSS class for 18 seconds — triggers
 *     extra SICC animation overrides defined in globals.css
 *  4. Auto-dismisses; user can also tap/press Esc to close early
 *
 * Architecture: Zero dependencies beyond React + framer-motion
 * (both already in the bundle). No audio, no heavy assets.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KONAMI = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

const HYPER_DURATION_MS = 18_000;
const OVERLAY_DURATION_MS = 4_200;

const MESSAGES = [
  '✦ HYPER DREAM MODE ✦',
  'YOUR UNIVERSE JUST GOT LOUDER',
  'ALL SYSTEMS: DREAMING',
  'REALITY.EXE HAS BEEN REPLACED',
];

export default function KonamiDream() {
  const [active, setActive]   = useState(false);
  const [msgIdx, setMsgIdx]   = useState(0);

  const activate = useCallback(() => {
    setActive(true);
    setMsgIdx(Math.floor(Math.random() * MESSAGES.length));

    // Apply body class for SICC hyper cascade
    document.body.classList.add('hyper-dream');

    // Remove body class after HYPER_DURATION_MS
    const bodyTimer = window.setTimeout(() => {
      document.body.classList.remove('hyper-dream');
    }, HYPER_DURATION_MS);

    // Auto-close overlay
    const overlayTimer = window.setTimeout(() => {
      setActive(false);
    }, OVERLAY_DURATION_MS);

    return () => {
      clearTimeout(bodyTimer);
      clearTimeout(overlayTimer);
    };
  }, []);

  // Konami sequence detection
  useEffect(() => {
    let pos = 0;

    const handler = (e: KeyboardEvent) => {
      if (e.key === KONAMI[pos]) {
        pos += 1;
        if (pos === KONAMI.length) {
          pos = 0;
          activate();
        }
      } else {
        // Reset on mismatch (allow restart from beginning if first key matches)
        pos = e.key === KONAMI[0] ? 1 : 0;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activate]);

  const dismiss = useCallback(() => {
    setActive(false);
  }, []);

  // Esc to dismiss
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [active, dismiss]);

  return (
    <>
      {/* Inline keyframes — hyper-dream mode animations */}
      <style>{`
        @keyframes hd-glitch-h {
          0%,100% { clip-path: inset(0 0 95% 0); transform: translateX(0);   }
          20%      { clip-path: inset(8% 0 60% 0); transform: translateX(-6px); }
          40%      { clip-path: inset(50% 0 30% 0); transform: translateX(4px);  }
          60%      { clip-path: inset(20% 0 70% 0); transform: translateX(-3px); }
          80%      { clip-path: inset(70% 0 15% 0); transform: translateX(5px);  }
        }
        @keyframes hd-scanline {
          from { transform: translateY(-100%); }
          to   { transform: translateY(100vh); }
        }
        @keyframes hd-border-spin {
          from { background-position: 0% 50%; }
          to   { background-position: 300% 50%; }
        }
        @keyframes hd-flash {
          0%,100% { opacity: 0; }
          8%,12%  { opacity: 0.9; }
          20%     { opacity: 0; }
          50%,54% { opacity: 0.5; }
          62%     { opacity: 0; }
        }
        @keyframes hd-letter-pop {
          0%   { opacity: 0; transform: scale(0.4) translateY(20px) rotate(-8deg); }
          60%  { opacity: 1; transform: scale(1.12) translateY(-4px) rotate(1deg); }
          100% { opacity: 1; transform: scale(1) translateY(0) rotate(0deg); }
        }
      `}</style>

      <AnimatePresence>
        {active && (
          <motion.div
            key="hyper-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            transition={{ duration: 0.1 }}
            onClick={dismiss}
            role="dialog"
            aria-label="Hyper Dream Mode activated"
            aria-modal="true"
            style={{
              position:       'fixed',
              inset:           0,
              zIndex:          9999,
              display:         'flex',
              flexDirection:   'column',
              alignItems:      'center',
              justifyContent:  'center',
              cursor:          'pointer',
              userSelect:      'none',
              background:      'radial-gradient(ellipse at center, rgba(0,8,20,0.97) 0%, rgba(0,4,12,0.99) 100%)',
              overflow:        'hidden',
            }}
          >
            {/* Scanline sweep */}
            <div
              aria-hidden="true"
              style={{
                position:   'absolute',
                top:         0,
                left:        0,
                right:       0,
                height:      '3px',
                background:  'linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.7) 50%, transparent 100%)',
                animation:   'hd-scanline 1.1s linear infinite',
                zIndex:      1,
              }}
            />

            {/* Screen flash */}
            <div
              aria-hidden="true"
              style={{
                position:   'absolute',
                inset:       0,
                background:  'rgba(200,152,26,0.6)',
                animation:   'hd-flash 2s ease forwards',
                zIndex:      2,
                pointerEvents: 'none',
              }}
            />

            {/* Rainbow border */}
            <div
              aria-hidden="true"
              style={{
                position:   'absolute',
                inset:       0,
                border:      '3px solid transparent',
                backgroundImage: `linear-gradient(#000, #000), linear-gradient(90deg,
                  #c8981a, #38bdf8, #6366f1, #ec4899, #22c55e, #c8981a, #38bdf8)`,
                backgroundOrigin: 'border-box',
                backgroundClip:   'padding-box, border-box',
                backgroundSize:   '200% 100%',
                animation:   'hd-border-spin 2s linear infinite',
                zIndex:      3,
                pointerEvents: 'none',
              }}
            />

            {/* Neon grid */}
            <div
              aria-hidden="true"
              style={{
                position:        'absolute',
                inset:            0,
                backgroundImage: 'linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px)',
                backgroundSize:  '40px 40px',
                zIndex:          4,
                pointerEvents:   'none',
              }}
            />

            {/* Main text */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.08 }}
              style={{
                position:   'relative',
                zIndex:      10,
                textAlign:   'center',
                padding:     '0 24px',
              }}
            >
              {/* Small eyebrow */}
              <div
                style={{
                  fontSize:      11,
                  letterSpacing: '0.32em',
                  fontWeight:    700,
                  color:         'rgba(56,189,248,0.7)',
                  textTransform: 'uppercase',
                  marginBottom:   12,
                  fontFamily:    'var(--font-space-grotesk, monospace)',
                }}
              >
                secret sequence detected
              </div>

              {/* Glitchy main headline */}
              <div
                style={{
                  position: 'relative',
                  display:  'inline-block',
                  lineHeight: 0.92,
                }}
              >
                <h1
                  style={{
                    fontSize:      'clamp(2.4rem, 10vw, 7rem)',
                    fontWeight:    900,
                    letterSpacing: '-0.03em',
                    background:    'linear-gradient(135deg, #e8d090 0%, #c8981a 30%, #38bdf8 60%, #ffffff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontFamily:    'var(--font-space-grotesk, sans-serif)',
                    margin:         0,
                  }}
                >
                  {MESSAGES[msgIdx]}
                </h1>

                {/* Glitch layer 1 */}
                <h1
                  aria-hidden="true"
                  style={{
                    position:      'absolute',
                    inset:          0,
                    margin:         0,
                    fontSize:      'clamp(2.4rem, 10vw, 7rem)',
                    fontWeight:    900,
                    letterSpacing: '-0.03em',
                    color:         'rgba(56,189,248,0.55)',
                    fontFamily:    'var(--font-space-grotesk, sans-serif)',
                    animation:     'hd-glitch-h 2.8s steps(1) infinite',
                    mixBlendMode:  'screen',
                  }}
                >
                  {MESSAGES[msgIdx]}
                </h1>

                {/* Glitch layer 2 */}
                <h1
                  aria-hidden="true"
                  style={{
                    position:      'absolute',
                    inset:          0,
                    margin:         0,
                    fontSize:      'clamp(2.4rem, 10vw, 7rem)',
                    fontWeight:    900,
                    letterSpacing: '-0.03em',
                    color:         'rgba(236,72,153,0.45)',
                    fontFamily:    'var(--font-space-grotesk, sans-serif)',
                    animation:     'hd-glitch-h 2.8s steps(1) 0.4s infinite reverse',
                    mixBlendMode:  'screen',
                  }}
                >
                  {MESSAGES[msgIdx]}
                </h1>
              </div>

              {/* Sub-line */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={{
                  marginTop:     16,
                  fontSize:      'clamp(0.75rem, 2.5vw, 1rem)',
                  color:         'rgba(160,195,240,0.65)',
                  letterSpacing: '0.12em',
                  fontFamily:    'var(--font-space-grotesk, monospace)',
                  textTransform: 'uppercase',
                  fontWeight:    500,
                }}
              >
                All SICC animations running at hyperspeed · tap anywhere to close
              </motion.p>

              {/* Progress bar */}
              <motion.div
                style={{
                  marginTop:   20,
                  height:       2,
                  background:  'rgba(255,255,255,0.08)',
                  borderRadius: 99,
                  overflow:    'hidden',
                  width:       '100%',
                  maxWidth:    320,
                  margin:      '20px auto 0',
                }}
              >
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: OVERLAY_DURATION_MS / 1000, ease: 'linear' }}
                  style={{
                    height:       '100%',
                    background:  'linear-gradient(90deg, #c8981a, #38bdf8)',
                    borderRadius: 99,
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Corner ✦ decorations */}
            {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
              <div
                key={corner}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  zIndex:    10,
                  fontSize:  22,
                  color:    'rgba(200,152,26,0.7)',
                  ...(corner === 'tl' ? { top: 20, left: 20 }   : {}),
                  ...(corner === 'tr' ? { top: 20, right: 20 }  : {}),
                  ...(corner === 'bl' ? { bottom: 20, left: 20 } : {}),
                  ...(corner === 'br' ? { bottom: 20, right: 20 }: {}),
                }}
              >
                ✦
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
