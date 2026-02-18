'use client';

import React from 'react';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';
import type { Node } from '@/lib/dreamnav/delta';
import { dispatchTauPath, findTauPath } from '@/lib/dreamnav/path';

export default function ViewAllDreamsOverlay({
  onClose,
  onReturnHome,
}: {
  onClose: () => void;
  onReturnHome: () => void;
}) {
  const { node, dispatch } = useDreamNav();

  const goTo = async (target: Node) => {
    const path = findTauPath(node, target);
    await dispatchTauPath(dispatch, path);
    onClose();
  };

  const Tile = ({ title, onClick }: { title: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left hover:bg-white/10"
    >
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Dream</div>
      <div className="mt-1 text-base font-semibold text-white/90">{title}</div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45" onClick={onClose}>
      <div
        className="w-[min(34rem,92vw)] rounded-[2rem] border border-white/20 bg-slate-950/90 p-5 text-white shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">Dreams</div>
            <div className="text-xl font-semibold">Navigate</div>
          </div>
          <button
            type="button"
            className="h-10 px-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Tile title="front" onClick={() => void goTo(1)} />
          <Tile title="back" onClick={() => void goTo(2)} />
          <Tile title="left" onClick={() => void goTo(3)} />
          <Tile title="right" onClick={() => void goTo(4)} />
          <Tile title="top" onClick={() => void goTo(5)} />
          <Tile title="bottom" onClick={() => void goTo(6)} />
          <Tile title="Music" onClick={() => void goTo('1b')} />
          <Tile title="Lab" onClick={() => void goTo('2b')} />
          <Tile title="Code" onClick={() => void goTo('3b')} />
          <Tile title="Brand" onClick={() => void goTo('4b')} />
          <Tile title="Games" onClick={() => void goTo('5b')} />
          <Tile title="Create" onClick={() => void goTo('6b')} />
        </div>

        <div className="mt-4 text-xs text-white/50">
          Tap a dream to move. Navigation is generated from τ (no direct jumps).{' '}
          <button type="button" className="underline" onClick={onReturnHome}>
            Return Home
          </button>
          .
        </div>
      </div>
    </div>
  );
}
