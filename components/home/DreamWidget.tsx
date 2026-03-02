'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Dream } from '@/lib/dreams/catalog';

type DreamMode = 'home' | 'profile';

type Props = {
  dream: Dream;
  mode: DreamMode;
  /** home mode — is it favorited? */
  isFavorite?: boolean;
  /** profile mode — is it pinned to public profile? */
  isPinned?: boolean;
  /** feed mode — is it an active live-feed source? */
  isActive?: boolean;
  onFavoriteToggle?: () => void;
  onPinToggle?: () => void;
  onActiveToggle?: () => void;
  mounted?: boolean;
};

/** Subtle pulse when a Dream is active/live */
const pulseStyle: React.CSSProperties = {
  animation: 'dream-pulse 2.8s ease-in-out infinite',
};

export default function DreamWidget({
  dream,
  mode,
  isFavorite,
  isPinned,
  isActive,
  onFavoriteToggle,
  onPinToggle,
  onActiveToggle,
  mounted = true,
}: Props) {
  const router = useRouter();
  const lit = mode === 'home' ? isActive : isPinned;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(dream.route)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(dream.route); }}
      style={{
        position: 'relative',
        background: lit
          ? 'linear-gradient(145deg, rgba(212,168,67,0.15), rgba(100,150,255,0.08))'
          : 'rgba(5,15,45,0.55)',
        border: lit
          ? '1px solid rgba(212,168,67,0.45)'
          : '1px solid rgba(100,150,255,0.1)',
        borderRadius: 16,
        padding: '13px 6px 10px',
        cursor: 'pointer',
        textAlign: 'center',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        ...(lit ? pulseStyle : {}),
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(100,150,255,0.12)'; }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = lit
          ? 'linear-gradient(145deg, rgba(212,168,67,0.15), rgba(100,150,255,0.08))'
          : 'rgba(5,15,45,0.55)';
      }}
    >
      {/* Status dot — active/pinned indicator */}
      {mounted && lit && (
        <span
          aria-hidden
          style={{
            position: 'absolute', top: 6, left: 7,
            width: 6, height: 6, borderRadius: '50%',
            background: mode === 'profile' ? '#d4a843' : '#22c55e',
            boxShadow: mode === 'profile'
              ? '0 0 6px rgba(212,168,67,0.8)'
              : '0 0 6px rgba(34,197,94,0.8)',
          }}
        />
      )}

      {/* Action button (top-right) */}
      {mounted && (
        <button
          type="button"
          aria-label={
            mode === 'profile'
              ? (isPinned ? 'Unpin from profile' : 'Pin to profile')
              : (mode === 'home' && onActiveToggle)
                ? (isActive ? 'Remove from feed' : 'Add to feed')
                : (isFavorite ? 'Remove favorite' : 'Add favorite')
          }
          onClick={(e) => {
            e.stopPropagation();
            if (mode === 'profile') onPinToggle?.();
            else if (onActiveToggle) onActiveToggle();
            else onFavoriteToggle?.();
          }}
          style={{
            position: 'absolute', top: 5, right: 5,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 2, fontSize: 10, lineHeight: 1,
            color: mode === 'profile'
              ? (isPinned ? '#d4a843' : 'rgba(160,185,255,0.25)')
              : (isActive ? '#22c55e' : isFavorite ? '#d4a843' : 'rgba(160,185,255,0.25)'),
          }}
        >
          {mode === 'profile' ? '📌' : isActive ? '●' : isFavorite ? '★' : '☆'}
        </button>
      )}

      <div style={{ fontSize: 22, marginBottom: 5, lineHeight: 1 }}>{dream.icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,244,255,0.92)', lineHeight: 1.2, marginBottom: 3 }}>
        {dream.label}
      </div>
      <div style={{ fontSize: 9, color: 'rgba(160,185,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {dream.tag}
      </div>
    </div>
  );
}
