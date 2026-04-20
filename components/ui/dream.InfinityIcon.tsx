'use client';

/**
 * InfinityIcon — SVG brand infinity mark for DREAMengin.
 *
 * variant:
 *   'flat'      — just the symbol, aspect-ratio ~2:1 (width = 2 × size)
 *   'circle'    — circular badge container of size × size
 *   'squircle'  — iOS-style rounded-square badge of size × size
 *
 * colorScheme:
 *   'gold'      — gold left lobe + cyan right lobe (brand colours, image 2)
 *   'dark'      — white/silver symbol for use on dark/gold backgrounds (image 1)
 */
import React from 'react';

// Lemniscate ribbon path in a 100 × 50 viewBox.
// The bezier ribbon weaves through the centre creating the X-crossing effect.
const PATH =
  'M10,25 C10,12 18,4 28,4 C38,4 44,16 50,24 ' +
  'C56,32 62,46 72,46 C82,46 90,38 90,25 ' +
  'C90,12 82,4 72,4 C62,4 56,18 50,26 ' +
  'C44,34 38,46 28,46 C18,46 10,38 10,25 Z';

export type InfinityVariant = 'flat' | 'circle' | 'squircle';
export type InfinityColorScheme = 'gold' | 'dark';

export interface InfinityIconProps {
  /**
   * For 'flat': height in px (rendered width = 2 × size).
   * For 'circle' / 'squircle': container side length in px.
   */
  size?: number;
  variant?: InfinityVariant;
  colorScheme?: InfinityColorScheme;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export default function InfinityIcon({
  size = 40,
  variant = 'flat',
  colorScheme = 'gold',
  className = '',
  style,
  ariaLabel,
}: InfinityIconProps) {
  const isFlat = variant === 'flat';

  // Scale SVG to fit its context
  const svgW = isFlat ? size * 2 : Math.round(size * 0.80);
  const svgH = isFlat ? size      : Math.round(size * 0.40);

  const symbol = (
    <svg
      viewBox="0 0 100 50"
      width={svgW}
      height={svgH}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {colorScheme === 'gold' ? (
          <>
            <linearGradient id="de-inf-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD04A" />
              <stop offset="100%" stopColor="#E08800" />
            </linearGradient>
            <linearGradient id="de-inf-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5DE8FF" />
              <stop offset="100%" stopColor="#18B8E0" />
            </linearGradient>
            <clipPath id="de-inf-lft">
              <rect x="0" y="0" width="52" height="50" />
            </clipPath>
            <clipPath id="de-inf-rgt">
              <rect x="48" y="0" width="52" height="50" />
            </clipPath>
          </>
        ) : (
          <linearGradient id="de-inf-silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="50%"  stopColor="#c8d8f0" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        )}
      </defs>

      {colorScheme === 'gold' ? (
        <>
          <path d={PATH} fill="url(#de-inf-gold)" clipPath="url(#de-inf-lft)" />
          <path d={PATH} fill="url(#de-inf-cyan)" clipPath="url(#de-inf-rgt)" />
        </>
      ) : (
        <path d={PATH} fill="url(#de-inf-silver)" />
      )}
    </svg>
  );

  if (isFlat) {
    return (
      <span
        role={ariaLabel ? 'img' : undefined}
        aria-label={ariaLabel}
        aria-hidden={!ariaLabel || undefined}
        className={className}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}
      >
        {symbol}
      </span>
    );
  }

  // ── circle / squircle badge container ────────────────────────────────────────
  const radius = variant === 'circle' ? '50%' : `${Math.round(size * 0.22)}px`;
  const bg     = colorScheme === 'dark'
    ? '#0a0a0a'
    : 'rgba(255,255,255,0.92)';
  const bdr    = colorScheme === 'dark'
    ? '1.5px solid rgba(255,255,255,0.14)'
    : '1.5px solid rgba(200,152,26,0.45)';

  return (
    <span
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel || undefined}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        border: bdr,
        flexShrink: 0,
        ...style,
      }}
    >
      {symbol}
    </span>
  );
}
