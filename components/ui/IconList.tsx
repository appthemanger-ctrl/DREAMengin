'use client';

import Link from 'next/link';
import SheetIcon from './SheetIcon';

export type IconListItem = {
  icon: string;
  label: string;
  href: string;
  description?: string;
  /** Opens in a new tab with rel="noreferrer". */
  external?: boolean;
};

type Props = {
  items: IconListItem[];
  /** px size for each icon. Defaults to 32. */
  iconSize?: number;
  className?: string;
};

/**
 * Renders a vertical list of icon + label navigation links.
 * Each row uses the .pillBtn glass-capsule style from globals.css.
 */
export default function IconList({ items, iconSize = 32, className = '' }: Props) {
  return (
    <ul
      className={className}
      style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noreferrer' : undefined}
            className="pillBtn"
            style={{ width: '100%', justifyContent: 'flex-start', textDecoration: 'none' }}
          >
            <SheetIcon name={item.icon} size={iconSize} ariaLabel={item.label} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>
                {item.label}
              </span>
              {item.description && (
                <span style={{ display: 'block', fontSize: 12, opacity: 0.65, lineHeight: 1.4, marginTop: 2 }}>
                  {item.description}
                </span>
              )}
            </span>
            {/* chevron */}
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{ flexShrink: 0, opacity: 0.55 }}
            >
              <path d="M5 2.5L9.5 7 5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  );
}
