'use client';

import React from 'react';
import { useDreamNav } from '@/components/dreamnav/DreamNavSurface6';
import type { Node } from '@/lib/dreamnav/delta';
import { dispatchTauPath, findTauPath } from '@/lib/dreamnav/path';

interface OutdreamMenuProps {
  onClose: () => void;
}

export default function OutdreamMenu({ onClose }: OutdreamMenuProps) {
  const { node, dispatch } = useDreamNav();

  const goTo = async (target: Node) => {
    const path = findTauPath(node, target);
    await dispatchTauPath(dispatch, path);
    onClose();
  };

  const dayDreams = [
    // Map day dreams to outer-shell nodes. Navigation is generated from τ.
    { id: 'music',  label: 'Music · Release',       node: '1b' as const },
    { id: 'lab',    label: 'Lab · Simulation',       node: '2b' as const },
    { id: 'code',   label: 'Code · Preview',         node: '3b' as const },
    { id: 'brand',  label: 'Brand · Analytics',      node: '4b' as const },
    { id: 'games',  label: 'Games · Play',           node: '5b' as const },
    { id: 'create', label: 'Create · Media Vault',   node: '6b' as const },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45" onClick={onClose}>
      <div
        className="w-[min(24rem,92vw)] rounded-3xl border border-white/20 bg-slate-950/90 p-4 text-white shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="px-2 text-sm uppercase tracking-[0.2em] text-white/60">Dreams</h2>
        <ul className="mt-2 space-y-1 max-h-80 overflow-y-auto">
          {dayDreams.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className="w-full min-h-11 rounded-2xl px-3 py-2 text-left text-sm hover:bg-white/10"
                onClick={() => {
                  void goTo(d.node);
                }}
              >
                {d.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
