'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetDefinition, WidgetInstance } from '@/types/widget-system-v2';

type WidgetInstanceWithDefinition = WidgetInstance & { widget_definitions: WidgetDefinition };

type Props = {
  surfaceKey?: number; // default 0
  onAddSlot?: (slotIndex: number) => void;
};

type ApiResponse = { items: WidgetInstanceWithDefinition[]; error?: string };

function pickBySlot(items: WidgetInstanceWithDefinition[]): Record<number, WidgetInstanceWithDefinition> {
  const out: Record<number, WidgetInstanceWithDefinition> = {};
  for (const it of items) {
    if (typeof it.slot_index === 'number' && it.slot_index >= 0 && it.slot_index <= 7) {
      out[it.slot_index] = it;
    }
  }
  return out;
}

export default function HomeFavoritesRing({ surfaceKey = 0, onAddSlot }: Props) {
  const cacheRef = useRef<Map<string, WidgetInstanceWithDefinition[]>>(new Map());
  const key = useMemo(() => `HOME:${surfaceKey}`, [surfaceKey]);

  const [items, setItems] = useState<WidgetInstanceWithDefinition[]>(() => cacheRef.current.get(key) || []);
  const [loading, setLoading] = useState(() => !cacheRef.current.has(key));

  useEffect(() => {
    let aborted = false;

    async function load() {
      const cached = cacheRef.current.get(key);
      if (cached) {
        setItems(cached);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/widgets/instances?surface=HOME&surface_key=${surfaceKey}`, { cache: 'no-store' });
        const data: ApiResponse = await res.json();
        const next = data.items || [];
        cacheRef.current.set(key, next);
        if (!aborted) setItems(next);
      } catch (e) {
        console.error('[HomeFavoritesRing]', e);
        if (!aborted) setItems([]);
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => { aborted = true; };
  }, [key, surfaceKey]);

  const bySlot = useMemo(() => pickBySlot(items), [items]);

  // 8 slots around the center panel — minimal, battery-friendly.
  const slotPos: Array<{ top: string; left: string; }> = [
    { top: '6%', left: '50%' },   // 0 top
    { top: '14%', left: '78%' },  // 1 top-right
    { top: '50%', left: '90%' },  // 2 right
    { top: '78%', left: '78%' },  // 3 bottom-right
    { top: '90%', left: '50%' },  // 4 bottom
    { top: '78%', left: '22%' },  // 5 bottom-left
    { top: '50%', left: '10%' },  // 6 left
    { top: '14%', left: '22%' },  // 7 top-left
  ];

  const Slot = ({ idx }: { idx: number }) => {
    const it = bySlot[idx];
    const label = it ? it.widget_definitions?.name : 'Add';
    return (
      <button
        type="button"
        onClick={() => { if (!it) onAddSlot?.(idx); }}
        className="pointer-events-auto select-none w-14 h-14 rounded-2xl border border-white/10 bg-black/30 backdrop-blur text-white flex items-center justify-center text-[11px] leading-tight px-2 active:scale-[0.98] transition-transform"
        aria-label={it ? `Favorite widget ${label}` : `Add favorite widget in slot ${idx}`}
      >
        <span className="line-clamp-2 text-center">{label}</span>
      </button>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {!loading && (
        <>
          {slotPos.map((p, idx) => (
            <div
              key={idx}
              className="absolute"
              style={{ top: p.top, left: p.left, transform: 'translate(-50%, -50%)' }}
            >
              <Slot idx={idx} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
