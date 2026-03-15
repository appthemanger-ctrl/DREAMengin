'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DreamWord from '@/components/ui/DreamWord';

interface NexusMenuProps {
  onClose: () => void;
  onOpenDrEams: () => void;
  onViewAllDreams: () => void;
}

export default function NexusMenu({ onClose, onOpenDrEams, onViewAllDreams }: NexusMenuProps) {
  const router = useRouter();

  const items = [
    { label: 'Search', action: () => console.log('Search (todo)') },
    { label: 'Dr. Eams', action: onOpenDrEams },
    { label: 'Settings', action: () => router.push('/settings') },
    { label: 'Account', action: () => router.push('/settings/account') },
    { label: 'View All Dreams', action: onViewAllDreams },
    { label: 'Edit Layout', action: () => console.log('Edit Layout (todo)') },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45" onClick={onClose}>
      <div
        className="w-[min(22rem,92vw)] rounded-3xl border border-white/20 bg-slate-950/90 p-4 text-white shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="px-2 text-sm uppercase tracking-[0.2em] text-white/60"><DreamWord />Menu</h2>
        <ul className="mt-2 space-y-1">
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className="w-full min-h-11 rounded-2xl px-3 py-2 text-left text-sm hover:bg-white/10"
                onClick={() => {
                  item.action();
                  onClose();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
