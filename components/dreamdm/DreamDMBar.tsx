'use client';

/**
 * DreamDMBar — compact DreamDM access bar with unread message badge.
 *
 * Renders a DM icon button with a gold badge showing the unread notification
 * count. Designed for embedding in any persistent layout element (header,
 * sidebar, floating dock). Clicking navigates to /messages.
 *
 * Self-contained: fetches its own unread count via `useNotifications`.
 * Callers may also supply `externalUnreadCount` to override the internal fetch
 * (useful when the parent already has the count and wants to avoid double-polling).
 *
 * Design tokens: gold (#c8981a), accent (var(--de-accent)), text-dim.
 * Minimum tap target: 44×44 px.
 *
 * docs/dreamdm_bar_pass2.md §2.4 — DreamDM Bar Component
 */

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { useNotifications } from '@/lib/dreamdm/useNotifications';

interface DreamDMBarProps {
  /**
   * Override the internally-fetched unread count.
   * Pass this when a parent component already has the count to avoid
   * an additional polling interval.
   */
  externalUnreadCount?: number;
  /** Extra CSS classes for the outer container */
  className?: string;
}

export default function DreamDMBar({ externalUnreadCount, className = '' }: DreamDMBarProps) {
  const { unreadCount: internalCount, markAllRead } = useNotifications();
  const count = externalUnreadCount !== undefined ? externalUnreadCount : internalCount;
  const displayCount = count > 99 ? '99+' : count > 0 ? String(count) : '';

  return (
    <Link
      href="/messages"
      onClick={markAllRead}
      aria-label={count > 0 ? `DreamDM — ${count} unread message${count === 1 ? '' : 's'}` : 'DreamDM'}
      className={`relative inline-flex items-center justify-center rounded-xl transition-colors min-w-[44px] min-h-[44px] ${className}`}
      style={{ background: 'rgba(160,195,240,0.12)', color: 'var(--de-text-dim)' }}
    >
      <MessageSquare className="w-5 h-5" />

      {/* Unread badge */}
      {displayCount && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white"
          style={{
            minWidth: '16px',
            height: '16px',
            padding: '0 4px',
            background: '#c8981a',
            fontSize: '10px',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {displayCount}
        </span>
      )}
    </Link>
  );
}
