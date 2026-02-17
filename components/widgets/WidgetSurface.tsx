// components/widgets/WidgetSurface.tsx
// Widget System V2 surface renderer (client)
// Minimal tile presentation, aligned with schema + surface model.

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { HostKind, type WidgetDefinition, type WidgetInstance } from '@/types/widget-system-v2';

type SurfaceName = 'HOME' | 'FACE' | 'PROFILE' | 'DOCK';

type WidgetInstanceWithDefinition = WidgetInstance & {
  widget_definitions: WidgetDefinition;
};

interface WidgetSurfaceProps {
  surface: SurfaceName;
  surfaceKey: number; // 0 for HOME/PROFILE/DOCK, faceIndex for FACE
}

interface ApiResponse {
  items: WidgetInstanceWithDefinition[];
  error?: string;
}

function hostKindLabel(k: HostKind): string {
  switch (k) {
    case HostKind.HOST_FEED_VIEW:
      return 'Feed';
    case HostKind.HOST_COMPOSITE:
      return 'Composite';
    default:
      return 'Widget';
  }
}

export default function WidgetSurface({ surface, surfaceKey }: WidgetSurfaceProps) {
  const cacheRef = useRef<Map<string, WidgetInstanceWithDefinition[]>>(new Map());
  const key = useMemo(() => `${surface}:${surfaceKey}`, [surface, surfaceKey]);

  const [widgets, setWidgets] = useState<WidgetInstanceWithDefinition[]>(() => cacheRef.current.get(key) || []);
  const [loading, setLoading] = useState(() => !cacheRef.current.has(key));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;

    async function fetchWidgets() {
      const cached = cacheRef.current.get(key);
      if (cached) {
        setWidgets(cached);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/widgets/instances?surface=${surface}&surface_key=${surfaceKey}`, {
          cache: 'no-store',
        });

        if (!response.ok) throw new Error(`Failed to fetch widgets: ${response.status}`);

        const data: ApiResponse = await response.json();
        if (data.error) throw new Error(data.error);

        const items = data.items || [];
        cacheRef.current.set(key, items);

        if (!aborted) setWidgets(items);
      } catch (err) {
        console.error('[WidgetSurface] Error:', err);
        if (!aborted) setError(err instanceof Error ? err.message : 'Failed to load widgets');
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    fetchWidgets();
    return () => {
      aborted = true;
    };
  }, [key, surface, surfaceKey]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <p className="text-red-800 dark:text-red-200 font-medium">Failed to load widgets</p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center">
          <p className="text-slate-600 dark:text-slate-400">No widgets configured for this surface.</p>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
            surface={surface} key={surfaceKey}
          </p>
        </div>
      </div>
    );
  }

  // Sort deterministically: focus_rank asc, z_index desc, created_at asc
  const sorted = [...widgets].sort((a, b) => {
    if (a.focus_rank !== b.focus_rank) return a.focus_rank - b.focus_rank;
    if (a.z_index !== b.z_index) return b.z_index - a.z_index;
    return a.created_at.localeCompare(b.created_at);
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 gap-4">
        {sorted.map((instance) => {
          const def = instance.widget_definitions;
          return (
            <div
              key={instance.instance_id}
              className="aspect-square bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {hostKindLabel(def.host_kind)}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {def.name}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    #{instance.slot_index >= 0 ? instance.slot_index : 'free'}
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <div className="text-2xl mb-2">📦</div>
                    <div className="text-xs">{def.widget_id.slice(0, 8)}…</div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  focus {instance.focus_rank} · z {instance.z_index}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
