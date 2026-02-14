'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface OutdreamMenuProps {
  onClose: () => void;
}

export default function OutdreamMenu({ onClose }: OutdreamMenuProps) {
  const router = useRouter();

  const dayDreams = [
    { id: 'music', label: 'Music Studio / Releases', href: '/music/upload' },
    { id: 'lab', label: 'Lab: Notes / Simulator', href: '/lab' },
    { id: 'games', label: 'Games: Library / Play', href: '/home' },
    { id: 'code', label: 'Code: Space / Preview', href: '/connectors' },
    { id: 'brand', label: 'Brand: Management / Analytics', href: '/analytics' },
    { id: 'create', label: 'Create: Projects / Vault', href: '/shop/sell' },
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
                  router.push(d.href);
                  onClose();
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
