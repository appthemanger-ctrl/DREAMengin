'use client';

import React, { useMemo } from 'react';

type Item = {
  id: string;
  label: string;
  onSelect: () => void;
};

type Props = {
  open: boolean;
  anchor: DOMRect | null;
  items: Item[];
  onClose: () => void;
};

export default function RadialMenu({ open, anchor, items, onClose }: Props) {
  const points = useMemo(() => {
    const radius = 104;
    return items.map((_, index) => {
      const angle = ((Math.PI * 2) / Math.max(items.length, 1)) * index - Math.PI / 2;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  }, [items]);

  if (!open || !anchor) return null;

  const centerX = anchor.left + anchor.width / 2;
  const centerY = anchor.top + anchor.height / 2;

  return (
    <div className="fixed inset-0 z-50" onPointerDown={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="absolute"
        style={{ left: centerX, top: centerY }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => {
          const p = points[index];
          return (
            <button
              key={item.id}
              type="button"
              className="absolute h-12 min-w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-slate-950/90 px-3 text-xs text-white transition-all duration-150 ease-out animate-[fadeIn_160ms_ease-out]"
              style={{ transform: `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))` }}
              onClick={() => {
                item.onSelect();
                onClose();
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
