'use client';

/**
 * PlatformBadge
 *
 * Renders a single platform icon from the iconslist.png sprite sheet on a
 * brand-coloured rounded background.  The JPEG sheet has no alpha channel, so
 * near-white pixels are stripped once (on first load) via an offscreen canvas,
 * leaving the logo transparent against its brand colour.
 *
 * The processed sheet is cached at module level — all badges on the page share
 * the same one-time pixel-processing pass.
 */

import { useEffect, useRef } from 'react';
import { SHEET_PATH, COLS, ROWS, ICONS, hasIcon, type IconName } from '@/lib/icons/sheet';

// ─── Constants ────────────────────────────────────────────────────────────────
/** Pixel brightness threshold above which a channel is considered "near-white". */
const WHITE_THRESHOLD = 230;

// ─── Brand colours ────────────────────────────────────────────────────────────
const BRAND: Record<string, string> = {
  facebook:       '#1877F2',
  twitter:        '#1DA1F2',
  instagram:      '#C13584',
  linkedin:       '#0A66C2',
  youtube:        '#FF0000',
  tiktok:         '#010101',
  messenger:      '#0084FF',
  discord:        '#5865F2',
  spotify:        '#1DB954',
  snapchat:       '#FFFC00',
  reddit:         '#FF4500',
  whatsapp:       '#25D366',
  twitch:         '#9146FF',
  pinterest:      '#E60023',
  soundcloud:     '#FF5500',
  dropbox:        '#0061FF',
  figma:          '#F24E1E',
  medium:         '#1a1a1a',
  'apple-music':  '#FC3C44',
  'youtube-music':'#FF0000',
  netflix:        '#E50914',
  hulu:           '#1CE783',
};

// ─── Sheet singleton ──────────────────────────────────────────────────────────
let _sheet:   HTMLCanvasElement | null = null;
let _loading  = false;
const _waiters: Array<(c: HTMLCanvasElement) => void> = [];

function getSheet(cb: (c: HTMLCanvasElement) => void) {
  if (_sheet) { cb(_sheet); return; }
  _waiters.push(cb);
  if (_loading) return;
  _loading = true;

  const img = new Image();
  img.src = SHEET_PATH;
  img.onload = () => {
    const c   = document.createElement('canvas');
    c.width   = img.naturalWidth;
    c.height  = img.naturalHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, c.width, c.height);
      const d  = id.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > WHITE_THRESHOLD && d[i + 1] > WHITE_THRESHOLD && d[i + 2] > WHITE_THRESHOLD) d[i + 3] = 0;
      }
      ctx.putImageData(id, 0, 0);
    }
    _sheet = c;
    _waiters.forEach((fn) => fn(c));
    _waiters.length = 0;
  };
  img.onerror = () => { _loading = false; };
}

// ─── Component ────────────────────────────────────────────────────────────────
type Props = {
  name: string;
  size?: number;
  label?: string;
  className?: string;
};

export default function PlatformBadge({ name, size = 44, label, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const key = (hasIcon(name) ? name : 'dot') as IconName;
  const { col, row } = ICONS[key];
  const bg = BRAND[name] ?? 'rgba(80,80,110,0.85)';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr   = window.devicePixelRatio || 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    getSheet((sheet) => {
      const cellW = sheet.width  / COLS;
      const cellH = sheet.height / ROWS;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(sheet, col * cellW, row * cellH, cellW, cellH, 0, 0, size, size);
    });
  }, [size, col, row]);

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
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, display: 'block' }}
      />
    </span>
  );
}
