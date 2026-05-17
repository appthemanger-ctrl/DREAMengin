'use client';

/**
 * components/shared-dream/dream.SharedDreamCanvas.tsx — §38 Shared Dream Canvas
 *
 * Split-view canvas:
 *   Top half  — shared view visible to ALL participants
 *   Bottom half — private controls, per-user only
 *
 * Props:
 *   componentId — unique ID for this canvas instance
 *   children    — rendered inside the private (bottom) section
 *   sharedContent — rendered inside the shared (top) section
 */

import React, { useCallback } from 'react';
import { useSharedDream } from './dream.SharedDreamProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SharedDreamCanvasProps {
  componentId:    string;
  children?:      React.ReactNode;
  sharedContent?: React.ReactNode;
  className?:     string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SharedDreamCanvas(){
  componentId,
  children,
  sharedContent,
  className = '',
}: SharedDreamCanvasProps) {
  const { connected, participants, cursors, moveCursor, mode, role } = useSharedDream();

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      void moveCursor(event.clientX - rect.left, event.clientY - rect.top);
    },
    [moveCursor],
  );

  return (
    <div
      data-component-id={componentId}
      className={`flex flex-col w-full h-full overflow-hidden rounded-xl border border-white/10 ${className}`}
    >
      {/* ── Shared view (top) ─────────────────────────────────────────────── */}
      <div
        className="relative flex-1 min-h-0 bg-black/40 border-b border-white/10 overflow-hidden"
        onPointerMove={handlePointerMove}
      >

        {/* Status bar */}
        <div className="absolute top-2 left-2 right-2 z-10 flex items-center gap-2 pointer-events-none">
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-500'}`}
          />
          <span className="text-[10px] text-white/50 font-mono">
            {connected
              ? `${participants.length} participant${participants.length !== 1 ? 's' : ''}`
              : 'disconnected'}
          </span>
          <span className="text-[10px] text-white/30 font-mono ml-auto">
            {mode} · {role}
          </span>
          <span className="text-[10px] text-white/30 font-mono">
            shared view
          </span>
        </div>

        {/* Shared content */}
        <div className="w-full h-full pt-7">
          {sharedContent ?? (
            <div className="flex items-center justify-center h-full text-white/20 text-sm">
              Shared canvas — visible to all
            </div>
          )}
        </div>

        {/* Remote cursors */}
        {cursors.map((c: Record<string, unknown>) => (
          <div
            key={c.peerId}
            className="absolute pointer-events-none transition-transform duration-75"
            style={{ left: c.x, top: c.y, transform: 'translate(-50%,-50%)' }}
          >
            <div className="w-3 h-3 rounded-full bg-violet-400/80 border border-white/40 shadow-lg" />
            <span className="absolute left-4 top-0 text-[9px] text-violet-300 font-mono whitespace-nowrap">
              {c.peerId.slice(0, 8)}
            </span>
          </div>
        ))}
      </div>

      {/* ── Private controls (bottom) ─────────────────────────────────────── */}
      <div className="relative flex-shrink-0 min-h-[80px] bg-black/60 overflow-auto">
        <div className="absolute right-2 top-1 text-[9px] text-white/20 font-mono pointer-events-none select-none">
          private
        </div>
        {children}
      </div>
    </div>
  );
}