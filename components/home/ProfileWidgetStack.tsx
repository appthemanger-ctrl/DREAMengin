'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetDefinition, WidgetInstance } from '@/types/widget-system-v2';

type WidgetInstanceWithDefinition = WidgetInstance & { widget_definitions: WidgetDefinition };
type ApiResponse = { items: WidgetInstanceWithDefinition[]; error?: string };

type Props = {
  surfaceKey?: number; // default 0
  onAdd?: () => void;
};

export default function ProfileWidgetStack({ surfaceKey = 0, onAdd }: Props) {
  const cacheRef = useRef<Map<string, WidgetInstanceWithDefinition[]>>(new Map());
  const key = useMemo(() => `PROFILE:${surfaceKey}`, [surfaceKey]);

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
        const res = await fetch(`/api/widgets/instances?surface=PROFILE&surface_key=${surfaceKey}`, { cache: 'no-store' });
        const data: ApiResponse = await res.json();
        const next = data.items || [];
        cacheRef.current.set(key, next);
        if (!aborted) setItems(next);
      } catch (e) {
        console.error('[ProfileWidgetStack]', e);
        if (!aborted) setItems([]);
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => { aborted = true; };
  }, [key, surfaceKey]);

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      // slot_index asc (slotted), then z desc, then created asc
      const sa = typeof a.slot_index === 'number' ? a.slot_index : 999;
      const sb = typeof b.slot_index === 'number' ? b.slot_index : 999;
      if (sa !== sb) return sa - sb;
      if (a.z_index !== b.z_index) return b.z_index - a.z_index;
      return a.created_at.localeCompare(b.created_at);
    });
    return arr;
  }, [items]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-16">
      <div className="mt-4 space-y-3">
        {loading ? (
          <>
            {[0,1,2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </>
        ) : null}

        {!loading && sorted.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            <div className="text-sm font-semibold text-white">Your profile is empty.</div>
            <div className="text-xs mt-1">Add widgets to build your public profile layout.</div>
            <button
              type="button"
              onClick={onAdd}
              className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white text-black text-sm"
            >
              Add Widget
            </button>
          </div>
        ) : null}

        {!loading && sorted.map((it) => (
          <div
            key={it.instance_id}
            className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur p-4 text-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">Widget</div>
                <div className="text-sm font-semibold">{it.widget_definitions?.name ?? 'Untitled'}</div>
              </div>
              <div className="text-[10px] text-white/50">slot {it.slot_index}</div>
            </div>

            <div className="mt-3 rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white/70">
              Runtime placeholder — render {it.widget_definitions?.host_kind}.
            </div>
          </div>
        ))}

        {!loading && sorted.length > 0 ? (
          <button
            type="button"
            onClick={onAdd}
            className="w-full rounded-2xl border border-dashed border-white/20 bg-white/5 p-5 text-white/70 hover:text-white"
          >
            + Add Widget Slot
          </button>
        ) : null}
      </div>
    </div>
  );
}
