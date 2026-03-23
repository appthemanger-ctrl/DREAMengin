'use client';

/**
 * DreamWindowRail — Phase 8 §A Point 5
 *
 * Compact swipeable Dream Window strip positioned between the HomeDream feed
 * and the DreamDM Bar. Shows the user's configured Dream Windows as compact
 * tiles with a DreamSpace opener at the end.
 *
 * Data: fetches real Dream Window slots from /api/home-layout on mount.
 * Privacy: only the authenticated user's own layout is fetched (server-side RLS).
 *
 * Architecture:
 *   - docs/ARCHITECTURE.md §8  — gold/sky/white palette
 *   - docs/ARCHITECTURE.md §10 — CSS transitions only; no JS animation loops
 *   - docs/LAW.md Product law 3 — every action routes to a real surface
 */

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Music,
  Gamepad2,
  FlaskConical,
  Code2,
  Palette,
  Pen,
  Grid3x3,
  Sparkles,
  Plus,
  BarChart3,
  ShoppingBag,
  Store,
  MessageCircle,
  Compass,
} from 'lucide-react';
import DreamWord from '@/components/ui/DreamWord';

// ── Types ──────────────────────────────────────────────────────────────────────

interface LayoutSlot {
  id: string;
  type: string;
  title?: string;
  position: number;
  config?: Record<string, unknown>;
}

interface HomeLayout {
  slots: LayoutSlot[];
}

interface DreamWindowRailProps {
  /** Called when user taps the DreamSpace opener tile */
  onOpenDreamSpace?: () => void;
  /** User ID — used to derive slot context (future: real-time subscriptions) */
  userId?: string;
}

// ── Icon map ──────────────────────────────────────────────────────────────────

function SlotIcon({ type }: { type: string }) {
  const cls = 'w-5 h-5';
  switch (type) {
    case 'music':     return <Music className={cls} />;
    case 'games':     return <Gamepad2 className={cls} />;
    case 'lab':       return <FlaskConical className={cls} />;
    case 'code':      return <Code2 className={cls} />;
    case 'brand':     return <Palette className={cls} />;
    case 'create':    return <Pen className={cls} />;
    case 'analytics': return <BarChart3 className={cls} />;
    case 'shop':      return <ShoppingBag className={cls} />;
    case 'marketplace': return <Store className={cls} />;
    case 'messages':  return <MessageCircle className={cls} />;
    case 'discover':  return <Compass className={cls} />;
    default:          return <Grid3x3 className={cls} />;
  }
}

// Route map for typed slots
const SLOT_ROUTES: Record<string, string> = {
  music:       '/daydream/music',
  games:       '/daydream/games',
  lab:         '/daydream/lab',
  code:        '/daydream/code',
  brand:       '/daydream/brand',
  create:      '/daydream/create',
  analytics:   '/daydream/analytics',
  shop:        '/shop',
  marketplace: '/marketplace',
  messages:    '/messages',
  discover:    '/discover',
};

// Default Dream Window tiles shown when no user layout is configured.
// These surface real platform features that are otherwise hard to discover.
const DEFAULT_SLOTS: LayoutSlot[] = [
  { id: 'default-analytics',   type: 'analytics',   title: 'Analytics',   position: 0 },
  { id: 'default-messages',    type: 'messages',    title: 'DreamDM',     position: 1 },
  { id: 'default-discover',    type: 'discover',    title: 'Discover',    position: 2 },
  { id: 'default-shop',        type: 'shop',        title: 'Shop',        position: 3 },
  { id: 'default-marketplace', type: 'marketplace', title: 'Market',      position: 4 },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function DreamWindowRail({ onOpenDreamSpace, userId }: DreamWindowRailProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<HomeLayout | null>(null);
  const [loading, setLoading] = useState(true);

  // Phase 8 §A Point 4+5: fetch real Dream Window slots from DB
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetch('/api/home-layout')
      .then((r) => r.json())
      .then((data: { ok: boolean; layout?: HomeLayout }) => {
        if (data.ok && data.layout) setLayout(data.layout);
      })
      .catch(() => { /* show empty rail */ })
      .finally(() => setLoading(false));
  }, [userId]);

  const slots = layout?.slots?.length ? layout.slots : DEFAULT_SLOTS;

  const handleSlotTap = (slot: LayoutSlot) => {
    const route = SLOT_ROUTES[slot.type] ?? `/daydream/${slot.type}`;
    router.push(route);
  };

  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 12,
        borderRadius: 20,
        background: 'rgba(255,255,255,0.70)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(200,152,26,0.18)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}
      aria-label="Dream Window Rail"
    >
      {/* Header */}
      <div style={{
        padding: '10px 16px 8px',
        borderBottom: '1px solid rgba(200,152,26,0.10)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Sparkles size={13} style={{ color: '#c8981a', flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>
          Dream Windows
        </span>
        <button
          type="button"
          onClick={() => router.push('/settings/widgets')}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, color: 'var(--de-accent)', fontWeight: 600,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Plus size={11} /> Add
        </button>
      </div>

      {/* Swipeable tile strip */}
      <div
        ref={scrollRef}
        data-scroll
        style={{
          display: 'flex', gap: 8,
          padding: '10px 14px 12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {loading ? (
          // Loading skeleton tiles
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`skel-${i}`}
              style={{
                width: 68, height: 72, borderRadius: 16, flexShrink: 0,
                background: 'rgba(200,152,26,0.06)',
                border: '1px solid rgba(200,152,26,0.10)',
                animation: 'pulse 1.8s ease-in-out infinite',
              }}
              aria-hidden="true"
            />
          ))
        ) : (
          // Dream Window slots: user layout from DB, or default platform tiles
          slots
            .sort((a, b) => a.position - b.position)
            .map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => handleSlotTap(slot)}
                style={{
                  width: 68, height: 72, borderRadius: 16, flexShrink: 0,
                  background: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(200,152,26,0.20)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 5,
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'transform 0.12s, box-shadow 0.12s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
                aria-label={slot.title ?? slot.type}
              >
                <div style={{ color: '#c8981a' }}>
                  <SlotIcon type={slot.type} />
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--de-heading)',
                  textAlign: 'center', lineHeight: 1.2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: 60,
                }}>
                  {slot.title ?? slot.type}
                </span>
              </button>
            ))
        )}

        {/* DreamSpace opener — always last */}
        <button
          type="button"
          onClick={() => onOpenDreamSpace?.()}
          style={{
            width: 68, height: 72, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(200,152,26,0.12), rgba(74,158,214,0.08))',
            border: '1.5px solid rgba(200,152,26,0.30)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 5,
            WebkitTapHighlightColor: 'transparent',
            transition: 'transform 0.12s',
            boxShadow: '0 2px 8px rgba(200,152,26,0.10)',
          }}
          aria-label="Open DreamSpace"
        >
          <span style={{ fontSize: 18 }}>✦</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#c8981a',
            textAlign: 'center', lineHeight: 1.2,
          }}>
            <DreamWord />Space
          </span>
        </button>
      </div>
    </div>
  );
}
