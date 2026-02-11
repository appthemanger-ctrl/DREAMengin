// components/widgets/WidgetSurface.tsx
// Client component for rendering widget instances in a 2-column grid

'use client';

import { useEffect, useState } from 'react';
import type { WidgetInstance } from '@/types/widgets';

interface WidgetSurfaceProps {
  space: 'home' | 'profile';
}

interface ApiResponse {
  items: WidgetInstance[];
  error?: string;
}

export default function WidgetSurface({ space }: WidgetSurfaceProps) {
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWidgets() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/widgets/instances?space=${space}`, {
          cache: 'no-store',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch widgets: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setWidgets(data.items || []);
      } catch (err) {
        console.error('[WidgetSurface] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load widgets');
      } finally {
        setLoading(false);
      }
    }
    
    fetchWidgets();
  }, [space]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
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
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <p className="text-red-800 dark:text-red-200 font-medium">
            Failed to load widgets
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            No widgets configured for this space.
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
            Add widgets to customize your {space} space.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-2 gap-4">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className="aspect-square bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col h-full">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                {widget.type || 'Widget'}
              </div>
              <div className="flex-1 flex items-center justify-center text-slate-400">
                {/* Widget content would go here */}
                <div className="text-center">
                  <div className="text-2xl mb-2">📦</div>
                  <div className="text-xs">{widget.type}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
