'use client';

/**
 * components/draggable/DraggableModule.tsx
 *
 * Wraps any Dream Window (child) with tap-hold drag, edge detection, and
 * cross-runtime transfer behaviour — the core of the Universal Editor.
 *
 * Interaction contract (no toggles):
 *   - Single tap/click  → passes through to children normally
 *   - Tap-hold ≥300ms   → lifts module (scale 1.05, gold shadow), enables drag
 *   - Drag              → translate3d follows pointer; no repaints
 *   - Drag to edge      → after 500ms at edge, fires transfer attempt
 *   - Release           → cancels drag; module snaps back (unless transferred)
 *   - Ctrl/Cmd+Arrow    → keyboard transfer (accessibility)
 *
 * Architecture justification:
 *   - docs/ARCHITECTURE.md §8  — Gold=action, Sky-blue=live/connected
 *   - docs/ARCHITECTURE.md §10 — render-on-demand, transform:translate3d only
 *   - docs/LAW.md §3           — every visible action must do something real
 *
 * Performance impact: GPU-composited transform; no layout thrashing; edge
 * detection batched via requestAnimationFrame.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import type { ModuleManifest, RuntimeId } from '@/types/module-manifest';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Hold duration before drag mode activates (ms). */
const HOLD_MS = 300;
/** Pixels from screen edge that triggers an edge-transfer zone. */
const EDGE_THRESHOLD = 50;
/** How long pointer must hover at edge before transfer fires (ms). */
const EDGE_HOLD_MS = 500;
/** Pixels of movement before hold is cancelled (prevents accidental lifts). */
const MOVE_CANCEL_PX = 8;

// ── Types ─────────────────────────────────────────────────────────────────────

interface DraggableModuleProps {
  manifest: ModuleManifest;
  children: React.ReactNode;
  className?: string;
  /** Called when a transfer completes successfully. */
  onTransfer?: (manifest: ModuleManifest, targetRuntime: RuntimeId) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DraggableModule({
  manifest,
  children,
  className,
  onTransfer,
}: DraggableModuleProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [lifted, setLifted] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [edgeSide, setEdgeSide] = useState<'left' | 'right' | null>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // ── Refs (don't need re-render) ───────────────────────────────────────────
  const rootRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const edgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafHandle = useRef<number | null>(null);
  const capturedPointerId = useRef<number | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const cancelHoldTimer = useCallback(() => {
    if (holdTimer.current !== null) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const cancelEdgeTimer = useCallback(() => {
    if (edgeTimer.current !== null) {
      clearTimeout(edgeTimer.current);
      edgeTimer.current = null;
    }
    setEdgeSide(null);
  }, []);

  const cancelDrag = useCallback(() => {
    isDragging.current = false;
    if (capturedPointerId.current !== null && rootRef.current) {
      try {
        rootRef.current.releasePointerCapture(capturedPointerId.current);
      } catch {
        // pointer may already be gone
      }
      capturedPointerId.current = null;
    }
    setLifted(false);
    setTranslate({ x: 0, y: 0 });
    cancelEdgeTimer();
    if (rafHandle.current !== null) {
      cancelAnimationFrame(rafHandle.current);
      rafHandle.current = null;
    }
  }, [cancelEdgeTimer]);

  // ── Transfer logic ────────────────────────────────────────────────────────

  const resolveTargetRuntime = useCallback(
    (clientX: number): RuntimeId | null => {
      if (clientX < EDGE_THRESHOLD) {
        // Left edge: opposite of current runtime
        if (manifest.sourceRuntime === 'dreamspace') return 'homedream';
        return 'dreamspace';
      }
      if (typeof window !== 'undefined' && clientX > window.innerWidth - EDGE_THRESHOLD) {
        // Right edge: opposite of current runtime
        if (manifest.sourceRuntime === 'homedream') return 'dreamspace';
        return 'homedream';
      }
      return null;
    },
    [manifest.sourceRuntime],
  );

  const performTransfer = useCallback(
    (targetRuntime: RuntimeId) => {
      if (!manifest.compatibleRuntimes.includes(targetRuntime)) {
        // Incompatible — dispatch a toast and cancel
        window.dispatchEvent(
          new CustomEvent('dream:toast', {
            detail: {
              type: 'error',
              message: `Cannot transfer to ${targetRuntime} — runtime not compatible`,
            },
          }),
        );
        cancelDrag();
        return;
      }

      setTransferring(true);
      cancelEdgeTimer();

      bridge.emit('module', 'transfer', {
        module: manifest as unknown as Record<string, unknown>,
        targetRuntime,
        sourceRuntime: manifest.sourceRuntime,
      });

      onTransfer?.(manifest, targetRuntime);

      // Give the transfer animation 350 ms then clean up
      setTimeout(() => {
        setTransferring(false);
        cancelDrag();
      }, 350);
    },
    [manifest, cancelDrag, cancelEdgeTimer, onTransfer],
  );

  // ── Pointer event handlers ────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!manifest.ui.movable) return;
      // Only primary button for mouse; any touch
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      startPos.current = { x: e.clientX, y: e.clientY };

      holdTimer.current = setTimeout(() => {
        holdTimer.current = null;
        isDragging.current = true;
        setLifted(true);
        capturedPointerId.current = e.pointerId;
        try {
          rootRef.current?.setPointerCapture(e.pointerId);
        } catch {
          // ignore — not all browsers support capture for all pointer types
        }
      }, HOLD_MS);
    },
    [manifest.ui.movable],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;

      // If not yet lifted, cancel hold timer on significant movement (scroll intent)
      if (!isDragging.current) {
        if (Math.sqrt(dx * dx + dy * dy) > MOVE_CANCEL_PX) {
          cancelHoldTimer();
        }
        return;
      }

      // GPU-composited translate — no layout reads
      setTranslate({ x: dx, y: dy });

      // Edge detection via rAF — batches with the browser paint
      if (rafHandle.current !== null) cancelAnimationFrame(rafHandle.current);
      rafHandle.current = requestAnimationFrame(() => {
        rafHandle.current = null;
        const target = resolveTargetRuntime(e.clientX);
        if (target) {
          const side: 'left' | 'right' = e.clientX < EDGE_THRESHOLD ? 'left' : 'right';
          setEdgeSide(side);
          if (edgeTimer.current === null) {
            edgeTimer.current = setTimeout(() => {
              edgeTimer.current = null;
              performTransfer(target);
            }, EDGE_HOLD_MS);
          }
        } else {
          cancelEdgeTimer();
        }
      });
    },
    [cancelHoldTimer, resolveTargetRuntime, cancelEdgeTimer, performTransfer],
  );

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent<HTMLDivElement>) => {
      cancelHoldTimer();
      if (!isDragging.current) return; // was a tap — let children handle it
      cancelDrag();
    },
    [cancelHoldTimer, cancelDrag],
  );

  const handlePointerCancel = useCallback(() => {
    cancelHoldTimer();
    cancelDrag();
  }, [cancelHoldTimer, cancelDrag]);

  // ── Keyboard accessibility ────────────────────────────────────────────────

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !manifest.ui.movable) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      let target: RuntimeId | null = null;
      if (e.key === 'ArrowRight') target = 'dreamspace';
      else if (e.key === 'ArrowLeft') target = 'homedream';
      if (!target) return;
      e.preventDefault();
      performTransfer(target);
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [manifest.ui.movable, performTransfer]);

  // ── Screen-edge aria announcement ─────────────────────────────────────────

  const edgeLabel =
    edgeSide === 'left'
      ? 'Approaching left edge — release to transfer to HomeDream'
      : edgeSide === 'right'
        ? 'Approaching right edge — release to transfer to DreamSpace'
        : undefined;

  // ── Derived styles — all GPU-composited ──────────────────────────────────

  const transform = lifted
    ? `translate3d(${translate.x}px,${translate.y}px,0) scale(1.05)`
    : 'translate3d(0,0,0) scale(1)';

  const boxShadow = lifted
    ? '0 24px 64px rgba(0,0,0,0.45), 0 0 0 1.5px rgba(200,152,26,0.45)'
    : undefined;

  const transition = lifted
    ? 'box-shadow 0.15s ease, opacity 0.3s ease'
    : 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease, opacity 0.3s ease';

  return (
    <>
      <div
        ref={rootRef}
        className={className}
        style={{
          position: 'relative',
          transform,
          zIndex: lifted ? 9999 : undefined,
          opacity: transferring ? 0 : 1,
          transition,
          boxShadow,
          cursor: lifted ? 'grabbing' : manifest.ui.movable ? 'grab' : undefined,
          touchAction: 'none',
          userSelect: 'none',
          willChange: lifted ? 'transform' : undefined,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        tabIndex={manifest.ui.movable ? 0 : undefined}
        aria-grabbed={lifted ? 'true' : 'false'}
        aria-label={manifest.ui.movable ? `Dream Window: ${manifest.id} (hold to drag)` : undefined}
        role={manifest.ui.movable ? 'button' : undefined}
      >
        {children}

        {/* Lifted lift-indicator border — gold ring */}
        {lifted && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: 'inherit',
              border: '1.5px solid rgba(200,152,26,0.6)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}
      </div>

      {/* Screen-edge glow overlays — fixed to viewport, rendered outside the module */}
      {lifted && (
        <>
          {/* Left edge glow */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: EDGE_THRESHOLD,
              height: '100dvh',
              pointerEvents: 'none',
              zIndex: 99997,
              background:
                'linear-gradient(to right, rgba(42,138,184,0.45) 0%, transparent 100%)',
              opacity: edgeSide === 'left' ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          />
          {/* Right edge glow */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: EDGE_THRESHOLD,
              height: '100dvh',
              pointerEvents: 'none',
              zIndex: 99997,
              background:
                'linear-gradient(to left, rgba(42,138,184,0.45) 0%, transparent 100%)',
              opacity: edgeSide === 'right' ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          />
        </>
      )}

      {/* Screen-reader announcement for edge proximity */}
      {edgeLabel && (
        <div role="status" aria-live="polite" className="sr-only">
          {edgeLabel}
        </div>
      )}
    </>
  );
}
