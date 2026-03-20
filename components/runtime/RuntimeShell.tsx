'use client';

/**
 * RuntimeShell
 *
 * A self-contained scrollable, zoomable, iframe-capable frame that wraps
 * every runtime world. Two instances run in parallel inside HomeSystem —
 * one for Surface Space, one for DreamSpace.
 *
 * Features:
 *  • Floating zoom controls (+ / %) that sit outside the scalable layer.
 *  • Inner scrollable + zoomable content via CSS transform-based viewport trick.
 *  • Iframe mode: when `iframeUrl` is set a chrome bar + `<iframe>` replace the
 *    children so the user never leaves the home surface.
 */

import React, { useState, useCallback } from 'react';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.15;
/** Height of the in-region iframe chrome bar (Back button + title) */
const CHROME_BAR_H = 44;

interface RuntimeShellProps {
  /** World content rendered when no iframe is open */
  children: React.ReactNode;
  /** When set, displays this URL in an in-region iframe instead of children */
  iframeUrl?: string | null;
  /** Called when the user taps Back to dismiss the iframe */
  onCloseIframe?: () => void;
  /** Optional label shown in the iframe chrome bar */
  iframeTitle?: string;
  /**
   * Safe-area insets (px) from DreamDMBar so content never hides behind the bar.
   *   top:    bar is at the screen top — reserve this many px before content
   *   bottom: bar is at the screen bottom — reserve this many px after content
   */
  barInsets?: { top: number; bottom: number };
}

export default function RuntimeShell({
  children,
  iframeUrl,
  onCloseIframe,
  iframeTitle,
  barInsets,
}: RuntimeShellProps) {
  const [zoom, setZoom] = useState(1.0);
  const insetTop    = barInsets?.top    ?? 0;
  const insetBottom = barInsets?.bottom ?? 0;

  const zoomIn  = useCallback(() => setZoom((z) => Math.min(Math.round((z + ZOOM_STEP) * 100) / 100, MAX_ZOOM)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(Math.round((z - ZOOM_STEP) * 100) / 100, MIN_ZOOM)), []);
  const resetZoom = useCallback(() => setZoom(1.0), []);

  const pct = Math.round(zoom * 100);
  const isDefault = pct === 100;

  /* ── shared button style helpers ─────────────────────────────────────────── */
  const ctrlBtn = (disabled: boolean): React.CSSProperties => ({
    width: 26, height: 26, borderRadius: '50%',
    border: 'none',
    background: disabled ? 'transparent' : 'rgba(255,255,255,0.08)',
    color: disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.80)',
    fontSize: 17, fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1,
    transition: 'background 0.12s, color 0.12s',
    WebkitTapHighlightColor: 'transparent',
    flexShrink: 0,
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* ── Zoom controls — positioned below any top inset, never zoomed ──── */}
      <div
        style={{
          position: 'absolute',
          top: insetTop + 8,
          right: 52, // leave room for other controls
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          background: 'rgba(2,8,24,0.72)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 20,
          padding: '2px 4px',
          border: '1px solid rgba(200,152,26,0.18)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.30)',
          userSelect: 'none',
        }}
      >
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          style={ctrlBtn(zoom <= MIN_ZOOM)}
        >
          −
        </button>
        <button
          type="button"
          onClick={resetZoom}
          aria-label={`Reset zoom — currently ${pct}%`}
          style={{
            minWidth: 34,
            height: 22,
            borderRadius: 9,
            border: 'none',
            background: isDefault ? 'transparent' : 'rgba(200,152,26,0.18)',
            color: isDefault ? 'rgba(255,255,255,0.40)' : '#d4a843',
            fontSize: 10,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.02em',
            transition: 'background 0.12s, color 0.12s',
            WebkitTapHighlightColor: 'transparent',
            padding: '0 3px',
            flexShrink: 0,
          }}
        >
          {pct}%
        </button>
        <button
          type="button"
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          style={ctrlBtn(zoom >= MAX_ZOOM)}
        >
          +
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {iframeUrl ? (
        /* ── Iframe mode — a sub-page is open inside this region ── */
        <>
          {/* Chrome bar with back button — sits below any top inset */}
          <div
            style={{
              position: 'absolute',
              top: insetTop,
              left: 0,
              right: 0,
              height: CHROME_BAR_H,
              zIndex: 199,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 8px',
              background: 'rgba(2,8,24,0.90)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderBottom: '1px solid rgba(200,152,26,0.20)',
              boxShadow: '0 1px 8px rgba(0,0,0,0.30)',
            }}
          >
            <button
              type="button"
              onClick={onCloseIframe}
              aria-label="Back to runtime"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 12px 5px 8px',
                border: 'none',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>‹</span>
              Back
            </button>
            {iframeTitle && (
              <span
                style={{
                  fontSize: 12, fontWeight: 700,
                  color: 'rgba(255,255,255,0.50)',
                  flex: 1, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {iframeTitle}
              </span>
            )}
          </div>

          {/* Iframe — fills region below chrome bar, above bottom inset */}
          <iframe
            src={iframeUrl}
            title={iframeTitle ?? 'Page'}
            style={{
              position: 'absolute',
              top: insetTop + CHROME_BAR_H,
              left: 0,
              right: 0,
              bottom: insetBottom,
              width: '100%',
              height: `calc(100% - ${insetTop + CHROME_BAR_H + insetBottom}px)`,
              border: 'none',
            }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
          />
        </>
      ) : (
        /*
         * ── Normal content mode — scrollable + zoomable ──
         *
         * Structure:
         *   1. Inset container (absolute, respects barInsets) — clips the safe area
         *   2. Scale div (fills inset container via 100/zoom × scale trick)
         *   3. Children — scroll inside the zoomed viewport
         *
         * Inset container ensures content never hides behind the DreamDMBar.
         * Scale div fills the inset area (not the full viewport):
         *   zoom=1.0 → 100%×100% → scale(1.0)  → fills inset container exactly
         *   zoom=1.5 → 66.7%×66.7% → scale(1.5) → fills inset container exactly
         *   zoom=0.75 → 133%×133% → scale(0.75) → fills inset container exactly
         */
        <div
          style={{
            position: 'absolute',
            top: insetTop,
            left: 0,
            right: 0,
            bottom: insetBottom,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(100 / zoom).toFixed(4)}%`,
              height: `${(100 / zoom).toFixed(4)}%`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
