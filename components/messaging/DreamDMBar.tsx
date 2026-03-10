'use client';

/**
 * DreamDMBar — Pass 1
 *
 * Persistent interaction rail and draggable spatial divider.
 *
 * Splits the viewport into:
 *   Surface Space  (above the bar)  — HomeDream / Daydream / active content
 *   DreamDM Bar    (the rail)       — draggable handle + compose + snap controls
 *   Dream Space    (below the bar)  — Dreams / widget layer / modular access
 *
 * Three canonical snap positions (README §22.6):
 *   surface-focus  — bar at 87 % from top   (Surface ~87 %, Dream ~13 %)
 *   balanced       — bar at 50 % from top   (50 / 50)
 *   dream-focus    — bar at 10 % from top   (Surface ~10 %, Dream ~90 %)
 *
 * Drag to resize, release to snap with a spring transition.
 * Compose draft persists across refreshes / restarts (localStorage).
 *
 * Architecture: Component layer — no DB access, no direct Supabase calls.
 * Privacy: Draft lives only in localStorage (user-private, CONSTITUTION Art. III).
 *
 * Spec: README.md §22 / §29
 */

import React, { useCallback, useEffect, useState } from 'react';
import { GripHorizontal, MessageCircle, Send } from 'lucide-react';
import { useDreamDMBar, type DreamDMSnapPoint } from '@/lib/daydream/useDreamDMBar';

/** Height of the interaction rail in pixels */
const BAR_H = 48;

/**
 * Spring snap transition used for bar and Dream Space panel.
 * cubic-bezier(0.34, 1.56, 0.64, 1) gives a subtle over-shoot that
 * communicates finality and physicality (README §22.6 snap animation spec).
 */
const SPRING_TRANSITION = '0.40s cubic-bezier(0.34, 1.56, 0.64, 1)';

// ── Label map for aria-label on snap buttons ────────────────────────────────
const SNAP_LABELS: Record<DreamDMSnapPoint, string> = {
  'surface-focus': 'Surface focus — expand surface space',
  'balanced':      'Balanced — equal split',
  'dream-focus':   'Dream focus — expand dream space',
};

// ────────────────────────────────────────────────────────────────────────────
export default function DreamDMBar() {
  const {
    snapPoint,
    setSnapPoint,
    barTopPct,
    isDragging,
    draft,
    setDraft,
    containerRef,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  } = useDreamDMBar();

  const [mounted,        setMounted]        = useState(false);
  const [composeFocused, setComposeFocused] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Route draft to /messages for send (Pass 1 — full inline send in Pass 2)
  const handleSend = useCallback(() => {
    if (!draft.trim()) return;
    window.location.href = `/messages?compose=${encodeURIComponent(draft.trim())}`;
  }, [draft]);

  if (!mounted) return null;

  const springTransition = isDragging ? 'none' : SPRING_TRANSITION;

  return (
    <div
      ref={containerRef}
      aria-label="DreamDM Bar"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* ── Dream Space ─────────────────────────────────────────────────── */}
      <div
        aria-label="Dream Space"
        style={{
          position: 'absolute',
          top:    `calc(${barTopPct * 100}% + ${BAR_H}px)`,
          left:   0,
          right:  0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(220,232,248,0.97) 0%, rgba(200,218,242,0.99) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          pointerEvents: 'auto',
          transition: springTransition,
        }}
      >
        <DreamSpaceContent snapPoint={snapPoint} onSetSnap={setSnapPoint} />
      </div>

      {/* ── DreamDM Bar handle / rail ────────────────────────────────────── */}
      <div
        role="separator"
        aria-label="DreamDM Bar — drag to resize"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        style={{
          position:       'absolute',
          top:            `${barTopPct * 100}%`,
          left:           0,
          right:          0,
          height:         BAR_H,
          display:        'flex',
          alignItems:     'center',
          gap:            10,
          padding:        '0 16px',
          cursor:         isDragging ? 'grabbing' : 'grab',
          touchAction:    'none',
          userSelect:     'none',
          pointerEvents:  'auto',
          zIndex:         1,
          transition:     springTransition,
          // Design tokens: gold + sky-blue gradient glass (THEME.md)
          background:     'linear-gradient(135deg, rgba(200,152,26,0.16) 0%, rgba(42,138,184,0.14) 100%)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderTop:      '1.5px solid rgba(200,152,26,0.38)',
          borderBottom:   '1px solid rgba(42,138,184,0.22)',
          boxShadow:      '0 -2px 12px rgba(0,0,0,0.07)',
        }}
      >
        {/* Grip icon — visual affordance */}
        <GripHorizontal
          size={16}
          aria-hidden
          style={{ color: 'var(--de-gold)', opacity: 0.75, flexShrink: 0 }}
        />

        {/* DreamDM icon */}
        <MessageCircle
          size={17}
          aria-hidden
          style={{ color: 'var(--de-blue)', flexShrink: 0 }}
        />

        {/* Quick compose field */}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setComposeFocused(true)}
          onBlur={() => setComposeFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          // Stop pointer-down from initiating a bar drag while typing
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="DreamDM…"
          aria-label="Quick compose"
          style={{
            flex:         1,
            minWidth:     0,
            background:   composeFocused ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.40)',
            border:       composeFocused
              ? '1.5px solid rgba(200,152,26,0.55)'
              : '1px solid rgba(160,195,240,0.45)',
            borderRadius: 9999,
            padding:      '5px 12px',
            fontSize:     13,
            color:        'var(--de-text)',
            outline:      'none',
            cursor:       'text',
            transition:   'background 0.18s ease, border 0.18s ease',
          }}
        />

        {/* Send button — shown only when draft has content */}
        {draft.trim() && (
          <button
            type="button"
            onClick={handleSend}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Send DreamDM"
            style={{
              background:    'linear-gradient(135deg, var(--de-gold) 0%, var(--de-blue) 100%)',
              border:        'none',
              borderRadius:  '50%',
              width:         32,
              height:        32,
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              cursor:        'pointer',
              flexShrink:    0,
              color:         'white',
            }}
          >
            <Send size={14} aria-hidden />
          </button>
        )}

        {/* Snap position dots */}
        <div
          style={{ display: 'flex', gap: 5, flexShrink: 0 }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {(['surface-focus', 'balanced', 'dream-focus'] as const).map((snap) => (
            <button
              key={snap}
              type="button"
              onClick={() => setSnapPoint(snap)}
              aria-label={SNAP_LABELS[snap]}
              aria-pressed={snapPoint === snap}
              style={{
                width:        8,
                height:       8,
                borderRadius: '50%',
                border:       'none',
                cursor:       'pointer',
                background:   snapPoint === snap ? 'var(--de-gold)' : 'rgba(42,138,184,0.35)',
                transition:   'background 0.18s',
                padding:      0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dream Space content (Pass 1 placeholder) ──────────────────────────────
interface DreamSpaceContentProps {
  snapPoint:  DreamDMSnapPoint;
  onSetSnap:  (snap: DreamDMSnapPoint) => void;
}

function DreamSpaceContent({ snapPoint, onSetSnap }: DreamSpaceContentProps) {
  const isCollapsed = snapPoint === 'surface-focus';

  if (isCollapsed) {
    // Thin strip — show only a subtle notification/compose indicator
    return (
      <div
        style={{
          height:         '100%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '0 20px',
          gap:            12,
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Dream Space</span>
        <button
          type="button"
          onClick={() => onSetSnap('balanced')}
          aria-label="Expand Dream Space"
          style={{
            fontSize:     11,
            color:        'var(--de-blue)',
            background:   'transparent',
            border:       '1px solid rgba(42,138,184,0.35)',
            borderRadius: 9999,
            padding:      '2px 10px',
            cursor:       'pointer',
          }}
        >
          Expand
        </button>
      </div>
    );
  }

  // Expanded — Dream widget grid (placeholder tiles, Pass 2 will wire real Dreams)
  return (
    <div style={{ padding: '16px 16px 80px' }}>
      <div style={{ marginBottom: 12 }}>
        <span className="de-tag" style={{ fontSize: 11 }}>Dreams</span>
        <p style={{ fontSize: 13, color: 'var(--de-text-dim)', marginTop: 4 }}>
          Your Dream Space
        </p>
      </div>

      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap:                 10,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="de-widget-tile"
            style={{ minHeight: 80, padding: 12 }}
          >
            <span className="de-tag" style={{ fontSize: 10 }}>Dream</span>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text)', marginTop: 4 }}>
              Slot {i + 1}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
