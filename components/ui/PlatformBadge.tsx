'use client';

/**
 * PlatformBadge
 *
 * Renders a platform icon badge.
 * Supports the legacy SVG icons (file, globe, window) as well as
 * all social media platforms defined in lib/social/platforms.ts.
 * Platforms that have an entry in the icon sprite sheet (iconslist.png)
 * are rendered via SheetIcon (glass/gold circular style).
 * When an onClick handler is provided the badge renders as a button.
 */

import Image from 'next/image';
import { PLATFORM_MAP } from '@/lib/social/platforms';
import SheetIcon from '@/components/ui/SheetIcon';
import { hasIcon } from '@/lib/icons/sheet';

// ─── Legacy SVG icons (file / globe / window) ─────────────────────────────────
const SVG_BRAND: Record<string, string> = {
  file:   '#2A8AB8',
  globe:  '#34d399',
  window: '#a78bfa',
};

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
  onClick?: () => void;
};

export default function PlatformBadge({ name, size = 44, label, className = '', onClick }: Props) {
  // Check legacy SVG icons first
  const svgPath = SVG_PATHS[name];
  const svgBg   = SVG_BRAND[name];

  // Check social platform registry
  const socialPlatform = PLATFORM_MAP[name];

  // Resolve background colour
  const bg = svgBg ?? socialPlatform?.color ?? 'rgba(80,80,110,0.85)';

  const sharedStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.24),
    background: bg,
    flexShrink: 0,
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : undefined,
    border: 'none',
    padding: 0,
    transition: onClick ? 'opacity 0.15s ease, transform 0.15s ease' : undefined,
  };

  const Tag = onClick ? 'button' : 'span';

  // ── Legacy SVG icon ────────────────────────────────────────────────────────
  if (svgPath) {
    return (
      <Tag
        type={onClick ? 'button' : undefined}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={!label ? true : undefined}
        title={label}
        className={className}
        style={{ ...sharedStyle, padding: Math.round(size * 0.20) }}
        onClick={onClick}
      >
        <Image
          src={svgPath}
          alt=""
          width={size}
          height={size}
          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
        />
      </Tag>
    );
  }

  // ── Social media platform ──────────────────────────────────────────────────
  if (socialPlatform) {
    // Prefer the glass/gold sheet icon when available
    if (hasIcon(name)) {
      return (
        <Tag
          type={onClick ? 'button' : undefined}
          aria-label={label ?? socialPlatform.label}
          title={label ?? socialPlatform.label}
          className={className}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size,
            height: size,
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: onClick ? 'pointer' : undefined,
            transition: onClick ? 'opacity 0.15s ease, transform 0.15s ease' : undefined,
          }}
          onClick={onClick}
        >
          <SheetIcon name={name} size={size} ariaLabel={label ?? socialPlatform.label} />
        </Tag>
      );
    }

    // Fallback: emoji for platforms not yet in the sprite sheet
    return (
      <Tag
        type={onClick ? 'button' : undefined}
        role={label ? 'img' : undefined}
        aria-label={label ?? socialPlatform.label}
        title={label ?? socialPlatform.label}
        className={className}
        style={sharedStyle}
        onClick={onClick}
      >
        <span style={{ fontSize: Math.round(size * 0.44), lineHeight: 1, userSelect: 'none' }}>
          {socialPlatform.emoji}
        </span>
      </Tag>
    );
  }

  // ── Fallback for unknown names ─────────────────────────────────────────────
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={!label ? true : undefined}
      title={label}
      className={className}
      style={sharedStyle}
      onClick={onClick}
    >
      <div style={{ width: size * 0.5, height: size * 0.5, background: 'rgba(255,255,255,0.3)', borderRadius: '50%' }} />
    </Tag>
  );
}
