'use client';

import {
  SHEET_PATH,
  COLS,
  ROWS,
  FRAME_W,
  FRAME_H,
  ICONS,
  hasIcon,
  type IconName,
} from '@/lib/icons/sheet';

type Props = {
  /** Registered icon name. Falls back to "dot" if unrecognised. */
  name: string;
  /** Display size in px (square). Defaults to FRAME_W (96). */
  size?: number;
  /** Accessible label. Omit for purely decorative icons. */
  ariaLabel?: string;
  className?: string;
};

/**
 * Renders a single icon from /public/images/iconslist.png via CSS
 * background-position.  No <img> tag — no layout shift, no extra request
 * once the sheet is cached.
 */
export default function SheetIcon({
  name,
  size = FRAME_W,
  ariaLabel,
  className = '',
}: Props) {
  if (process.env.NODE_ENV === 'development' && !hasIcon(name)) {
    console.warn(`[SheetIcon] unknown icon "${name}", falling back to "dot"`);
  }

  const key: IconName = hasIcon(name) ? name : 'dot';
  const { col, row } = ICONS[key];

  return (
    <span
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel || undefined}
      className={className}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        flexShrink: 0,
        backgroundImage: `url(${SHEET_PATH})`,
        backgroundRepeat: 'no-repeat',
        /* Scale sheet so every cell is exactly size × size */
        backgroundSize: `${COLS * size}px ${ROWS * size}px`,
        backgroundPosition: `${-(col * size)}px ${-(row * size)}px`,
      }}
    />
  );
}
