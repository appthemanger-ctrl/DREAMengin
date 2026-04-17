'use client';

/**
 * components/universal-editor/UniversalEditorWrapper.tsx — §39
 *
 * Wraps any module with always-active tap-hold-move behaviour.
 * No edit-mode toggle — drag mode is always available via tap-hold.
 *
 * Visual feedback:
 *   - Slight scale-up + violet ring during drag
 *   - Ghost cursor indicator at drag position
 */

import React, { useCallback, useState } from 'react';
import { useTapHoldMove, type Position } from './useTapHoldMove';
import type { ModuleManifest, RuntimeId } from '@/lib/universal-editor/module-manifest';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UniversalEditorWrapperProps {
  manifest:    ModuleManifest;
  children:    React.ReactNode;
  onMove?:     (manifest: ModuleManifest, position: Position) => void;
  onTransfer?: (manifest: ModuleManifest, targetRuntime: RuntimeId) => void;
  className?:  string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UniversalEditorWrapper({
  manifest,
  children,
  onMove,
  onTransfer,
  className = '',
}: UniversalEditorWrapperProps) {
  const [isDragging,   setIsDragging]   = useState(false);
  const [dragPos,      setDragPos]      = useState<Position | null>(null);
  const [transferHint, setTransferHint] = useState<RuntimeId | null>(null);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setTransferHint(null);
  }, []);

  const handleMove = useCallback((m: ModuleManifest, pos: Position) => {
    setDragPos(pos);
    onMove?.(m, pos);
  }, [onMove]);

  const handleTransfer = useCallback((m: ModuleManifest, target: RuntimeId) => {
    setTransferHint(target);
    setIsDragging(false);
    onTransfer?.(m, target);
    setTimeout(() => setTransferHint(null), 1500);
  }, [onTransfer]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragPos(null);
  }, []);

  const bindings = useTapHoldMove({
    manifest,
    onDragStart: handleDragStart,
    onMove:      handleMove,
    onTransfer:  handleTransfer,
    onDragEnd:   handleDragEnd,
  });

  return (
    <>
      <div
        {...bindings}
        data-module-id={manifest.id}
        data-module-type={manifest.type}
        className={[
          'relative select-none touch-none',
          isDragging
            ? 'scale-[1.02] ring-2 ring-violet-500/70 rounded-lg z-50'
            : 'transition-transform duration-150',
          className,
        ].join(' ')}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {children}

        {/* Drag indicator overlay */}
        {isDragging && (
          <div className="absolute inset-0 rounded-lg pointer-events-none bg-violet-500/10 border border-violet-500/30" />
        )}

        {/* Transfer hint badge */}
        {transferHint && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg pointer-events-none">
            <span className="px-3 py-1 rounded-full bg-violet-700/90 text-white text-xs font-bold shadow-lg">
              → {transferHint}
            </span>
          </div>
        )}
      </div>

      {/* Floating drag ghost at cursor position */}
      {isDragging && dragPos && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: dragPos.x + 12, top: dragPos.y + 12 }}
        >
          <div className="px-2 py-1 rounded bg-violet-900/80 border border-violet-500/40 text-[10px] text-violet-200 font-mono shadow-xl">
            {manifest.type} · {manifest.id.slice(0, 8)}
          </div>
        </div>
      )}
    </>
  );
}
