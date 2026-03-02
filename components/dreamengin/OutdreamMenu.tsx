'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface OutdreamMenuProps {
  onClose: () => void;
}

const dayDreams = [
  { id: 'music',   label: 'Music Studio / Releases',       route: '/daydream/music'     },
  { id: 'lab',     label: 'Lab: Notes / Simulator',        route: '/lab'                },
  { id: 'games',   label: 'Games: Library / Play',         route: '/daydream/games'     },
  { id: 'code',    label: 'Code: Space / Preview',         route: '/codespace'          },
  { id: 'brand',   label: 'Brand: Management / Analytics', route: '/daydream/brand'     },
  { id: 'create',  label: 'Create: Projects / Vault',      route: '/create'             },
];

export default function OutdreamMenu({ onClose }: OutdreamMenuProps) {
  const router = useRouter();

  const goTo = (route: string) => {
    onClose();
    router.push(route);
  };

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
                onClick={() => goTo(d.route)}
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
