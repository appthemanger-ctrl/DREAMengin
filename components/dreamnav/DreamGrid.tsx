'use client';

import React from 'react';
import type { Node } from '@/lib/dreamnav/delta';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';

type DreamTile = {
  id: Node;
  label: string;
  hint?: string;
};

const TILES: DreamTile[] = [
  { id: 1, label: 'front' },
  { id: 2, label: 'back' },
  { id: 3, label: 'left' },
  { id: 4, label: 'right' },
  { id: 5, label: 'top' },
  { id: 6, label: 'bottom' },

  { id: '1b', label: 'Music' },
  { id: '2b', label: 'Lab' },
  { id: '3b', label: 'Code' },
  { id: '4b', label: 'Brand' },
  { id: '5b', label: 'Games' },
  { id: '6b', label: 'Create' },
];

function planFromHome(target: Node): Array<'swipe_left'|'swipe_right'|'swipe_up'|'swipe_down'|'depth_in'|'depth_out'|'home'> {
  // We enter dreams mode from node 0. Build a deterministic action sequence from 0 → target using τ.
  // Mapping from 0:
  // swipe_up=1, swipe_down=2, swipe_left=3, swipe_right=4, depth_in=5, depth_out=6
  const seq: Array<any> = ['home'];

  if (target === 0) return seq;

  const isOuter = typeof target === 'string' && target.endsWith('b');
  const core = isOuter ? Number(target[0]) : (typeof target === 'number' ? target : 0);

  if (core === 1) seq.push('swipe_up');
  else if (core === 2) seq.push('swipe_down');
  else if (core === 3) seq.push('swipe_left');
  else if (core === 4) seq.push('swipe_right');
  else if (core === 5) seq.push('depth_in');
  else if (core === 6) seq.push('depth_out');

  if (isOuter) {
    // outer shell is reached by depth_out from the inner face
    // except 6b: from 0 depth_out gets 6; depth_out again gets 6b
    // and 5b: from 0 depth_in gets 5; depth_out gets 5b
    if (core === 6) {
      seq.push('depth_out'); // 6 -> 6b
    } else {
      seq.push('depth_out');
    }
  }

  return seq;
}

export default function DreamGrid({ onClose }: { onClose?: () => void }) {
  const { dispatch } = useDreamNav();

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm">
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 backdrop-blur p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-white/60">Dreams</div>
              <div className="text-sm font-semibold">Navigate</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm"
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {TILES.map((t) => (
              <button
                key={String(t.id)}
                type="button"
                onClick={() => {
                  const seq = planFromHome(t.id);
                  for (const a of seq) dispatch(a);
                  onClose?.();
                }}
                className="h-20 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.99] transition-transform text-left p-3"
              >
                <div className="text-[10px] text-white/60 uppercase tracking-[0.18em]">Dream</div>
                <div className="mt-1 text-sm font-semibold">{t.label}</div>
              </button>
            ))}
          </div>

          <div className="mt-4 text-[11px] text-white/50">
            Tap a dream to move. Navigation is generated from τ (no direct jumps).
          </div>
        </div>
      </div>
    </div>
  );
}
