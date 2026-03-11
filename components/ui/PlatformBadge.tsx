'use client';

/**
 * PlatformBadge
 *
 * Renders a platform icon using SVG files directly.
 * Supports the new SVG icons: file, globe, window.
 */

import Image from 'next/image';

// ─── Brand colours ────────────────────────────────────────────────────────────
const BRAND: Record<string, string> = {
  file:   '#2A8AB8',
  globe:  '#34d399',
  window: '#a78bfa',
};

// ─── SVG paths ────────────────────────────────────────────────────────────────
const SVG_PATHS: Record<string, string> = {
  file:   '/file.svg',
  globe:  '/globe.svg',
  window: '/window.svg',
};

// ─── Component ────────────────────────────────────────────────────────────────
type Props = {
  name: string;
  size?: number;
  label?: string;
  className?: string;
};

export default function PlatformBadge({ name, size = 44, label, className = '' }: Props) {
  const bg = BRAND[name] ?? 'rgba(80,80,110,0.85)';
  const svgPath = SVG_PATHS[name];

  if (!svgPath) {
    // Fallback for unknown icons
    return (
      <span
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={!label ? true : undefined}
        title={label}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.24),
          background: bg,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{ width: size * 0.5, height: size * 0.5, background: 'rgba(255,255,255,0.3)', borderRadius: '50%' }} />
      </span>
    );
  }

  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={!label ? true : undefined}
      title={label}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.24),
        background: bg,
        flexShrink: 0,
        overflow: 'hidden',
        padding: Math.round(size * 0.20),
      }}
    >
      <Image
        src={svgPath}
        alt=""
        width={size}
        height={size}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'brightness(0) invert(1)',
        }}
      />
    </span>
  );
}
