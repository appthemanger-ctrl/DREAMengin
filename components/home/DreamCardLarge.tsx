'use client';

/**
 * DreamCardLarge — Premium "destination" card for Dreams.
 * A4 requirements:
 *  - min-height 168px; ideal 190–220px
 *  - width: 78vw (mobile), max 420px
 *  - radius: 20px
 *  - soft border + soft shadow
 *  - Title, 1-line descriptor, recent activity, tap to open
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Dream } from '@/lib/dreams/catalog';

type Props = {
  dream: Dream;
  /** optional 1-line descriptor shown below the title */
  descriptor?: string;
  /** optional recent-activity text */
  activity?: string;
  /** whether this dream is an active live-feed source */
  isActive?: boolean;
};

export default function DreamCardLarge({
  dream,
  descriptor,
  activity,
  isActive,
}: Props) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${dream.label}`}
      onClick={() => router.push(dream.route)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') router.push(dream.route);
      }}
      style={{
        /* A4 sizing constraints */
        minHeight: 168,
        width: '78vw',
        maxWidth: 420,
        flexShrink: 0,

        /* Visual surface */
        background: isActive
          ? 'linear-gradient(145deg,rgba(212,168,67,0.13),rgba(5,15,45,0.75))'
          : 'rgba(5,15,45,0.72)',
        border: isActive
          ? '1px solid rgba(212,168,67,0.35)'
          : '1px solid rgba(100,150,255,0.13)',
        borderRadius: 20,
        padding: '20px 18px 18px',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: isActive
          ? '0 4px 28px rgba(212,168,67,0.18), 0 1px 0 rgba(255,255,255,0.04) inset'
          : '0 4px 20px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.03) inset',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'transform 0.12s, box-shadow 0.12s',
        /* tap feedback */
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.015)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
        (e.currentTarget as HTMLElement).style.filter = 'brightness(1.03)';
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLElement).style.filter = '';
      }}
    >
      {/* Header row: icon + live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 30, lineHeight: 1 }}>{dream.icon}</span>
        {isActive && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#22c55e',
              padding: '3px 8px',
              borderRadius: 20,
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 6px rgba(34,197,94,0.8)',
                animation: 'dream-pulse 2s ease-in-out infinite',
              }}
            />
            Live
          </span>
        )}
      </div>

      {/* Title — dominates */}
      <div
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: 'rgba(240,244,255,0.95)',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}
      >
        {dream.label}
      </div>

      {/* Descriptor — muted beneath title */}
      {(descriptor ?? dream.tag) && (
        <div
          style={{
            fontSize: 12,
            color: 'rgba(160,185,255,0.5)',
            fontWeight: 500,
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {descriptor ?? dream.tag}
        </div>
      )}

      {/* Recent activity */}
      {activity && (
        <div
          style={{
            fontSize: 11,
            color: 'rgba(212,168,67,0.55)',
            fontWeight: 600,
            lineHeight: 1.3,
            paddingTop: 6,
            borderTop: '1px solid rgba(100,150,255,0.08)',
          }}
        >
          {activity}
        </div>
      )}

      {/* CTA row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginTop: 'auto',
          paddingTop: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: isActive ? 'rgba(212,168,67,0.7)' : 'rgba(100,150,255,0.45)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Open →
        </span>
      </div>
    </div>
  );
}
