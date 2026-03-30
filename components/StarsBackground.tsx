'use client';

import { useState, useEffect, useRef } from 'react';

type StarLayer = 'near' | 'mid' | 'far';

interface StarDef {
  id: number;
  top: number;
  left: number;
  delay: number;
  size: number;
  layer: StarLayer;
  opacity: number;
  duration: number;
}

/** Three-layer deep starfield with parallax depth and size-based brightness. */
export function StarsBackground({ intensity = 'normal' }: { intensity?: 'normal' | 'dense' | 'minimal' }) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const count = intensity === 'dense' ? 80 : intensity === 'minimal' ? 25 : 50;

  // Deterministic star generation with seeded positions
  const stars: StarDef[] = Array.from({ length: count }, (_, i) => {
    const layer: StarLayer = i % 3 === 0 ? 'near' : i % 3 === 1 ? 'mid' : 'far';
    return {
      id: i,
      top: ((i * 17 + 7) % 100),
      left: ((i * 23 + 13) % 100),
      delay: (i * 0.37) % 4,
      size: layer === 'near' ? ((i % 3) + 1.5) : layer === 'mid' ? ((i % 2) + 1) : 0.75,
      layer,
      opacity: layer === 'near' ? 0.85 : layer === 'mid' ? 0.60 : 0.35,
      duration: layer === 'near' ? (2.5 + (i % 3) * 0.8) : layer === 'mid' ? (3 + (i % 4) * 0.7) : (4 + (i % 5) * 0.6),
    };
  });

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <style>{`
        @keyframes star-twinkle-near {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.65); }
        }
        @keyframes star-twinkle-mid {
          0%, 100% { opacity: 0.60; transform: scale(1); }
          50%       { opacity: 0.20; transform: scale(0.70); }
        }
        @keyframes star-twinkle-far {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.10; }
        }
        @keyframes star-drift {
          0%   { transform: translateY(0px) translateX(0px); }
          33%  { transform: translateY(-2px) translateX(1px); }
          66%  { transform: translateY(1px) translateX(-1px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .star-near, .star-mid, .star-far { animation: none !important; opacity: 0.5 !important; }
        }
      `}</style>

      {stars.map(star => (
        <div
          key={star.id}
          className={`star-${star.layer}`}
          style={{
            position: 'absolute',
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: star.layer === 'near'
              ? `radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(200,230,255,0.60) 60%, transparent 100%)`
              : star.layer === 'mid'
                ? `rgba(220,235,255,0.75)`
                : `rgba(200,215,240,0.55)`,
            boxShadow: star.layer === 'near'
              ? `0 0 ${star.size * 2}px rgba(200,230,255,0.5)`
              : 'none',
            animationName: `star-twinkle-${star.layer}${star.layer === 'near' ? ', star-drift' : ''}`,
            animationDuration: `${star.duration}s${star.layer === 'near' ? `, ${star.duration * 3}s` : ''}`,
            animationDelay: `${star.delay}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            willChange: 'opacity',
          }}
        />
      ))}

      {/* Subtle nebula glow orbs for depth */}
      <div style={{
        position: 'absolute',
        top: '8%', left: '72%',
        width: 80, height: 80,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)',
        animation: 'star-drift 12s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '62%', left: '15%',
        width: 60, height: 60,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,152,26,0.04) 0%, transparent 70%)',
        animation: 'star-drift 15s ease-in-out infinite alternate-reverse',
        pointerEvents: 'none',
        animationDelay: '3s',
      }} />
    </div>
  );
}
