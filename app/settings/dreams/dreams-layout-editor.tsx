'use client';

import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useDreamLayout } from '@/hooks/useDreamLayout';
import DraggableDream from '@/components/dreams/dream.DraggableDream';

const DEFAULT_DREAMS = [
  { id: 'home-feed', name: 'HomeDream Feed', surface: 'home' as const },
  { id: 'dreamspace-quick-note', name: 'Quick Note', surface: 'dreamspace' as const },
  { id: 'dreamspace-todays-stats', name: "Today’s Stats", surface: 'dreamspace' as const },
  { id: 'dreamspace-game-quick-launch', name: 'Game Quick Launch', surface: 'dreamspace' as const },
];

function buildLayoutFromDreams(dreams: Array<{ id: string; surface: 'home' | 'dreamspace' }> {
  return {
    home: { dreams: dreams.filter((dream: Record<string, unknown>) => dream.surface === 'home').map((dream: Record<string, unknown>) => dream.id) },
    dreamspace: { dreams: dreams.filter((dream: Record<string, unknown>) => dream.surface === 'dreamspace').map((dream: Record<string, unknown>) => dream.id) },
  };
}

export default function DreamsLayoutEditor( {
  const { layout, updateDreamLayout, resetDreamLayout } = useDreamLayout();
  const hidden = new Set(layout.hidden ?? []);
  const ordered = [
    ...layout.home.dreams.map((id: Record<string, unknown>) => ({ id, surface: 'home' as const })),
    ...layout.dreamspace.dreams.map((id: Record<string, unknown>) => ({ id, surface: 'dreamspace' as const })),
  ];
  const dreams = ordered.length > 0
    ? ordered.map((dream: Record<string, unknown>) => ({ ...dream, name: DEFAULT_DREAMS.find((item: Record<string, unknown>) => item.id === dream.id)?.name ?? dream.id }))
    : DEFAULT_DREAMS;

  return (
    <div className="de-widget">
      <div className="de-widget-header"><span className="de-widget-title">Dream layout editor</span></div>
      <div className="de-widget-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          {dreams.map((dream: Record<string, unknown>) => (
            <DraggableDream
              key={`${dream.surface}-${dream.id}`}
              dream={{ dream_id: dream.id, type: dream.id, surface: dream.surface, runtime: dream.surface === 'home' ? 'HOME' : 'FACE', title: dream.name }}
            >
              <div className="de-row" style={{ alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{dream.name}</div>
                  <div className="text-xs" style={{ color: 'var(--de-text-dim)', textTransform: 'uppercase' }}>{dream.surface}</div>
                </div>
                <button
                  type="button"
                  className="de-icon-btn"
                  aria-label={`Toggle ${dream.name}`}
                  onClick={() => {
                    const nextHidden = new Set(layout.hidden ?? []);
                    if (nextHidden.has(dream.id)) {
                      nextHidden.delete(dream.id);
                    } else {
                      nextHidden.add(dream.id);
                    }
                    updateDreamLayout({ ...layout, hidden: Array.from(nextHidden) }, 0);
                  }}
                >
                  {hidden.has(dream.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </DraggableDream>
          ))}
        </div>
      </div>
      <div className="de-widget-actions">
        <button type="button" className="de-btn de-btn-ghost text-xs" onClick={() => resetDreamLayout()}>
          <RotateCcw className="w-3 h-3" /> Reset layout
        </button>
        <button
          type="button"
          className="de-btn de-btn-primary text-xs"
          onClick={() => updateDreamLayout({ ...buildLayoutFromDreams(dreams), hidden: layout.hidden ?? [] }, 0)}
        >
          Save now
        </button>
      </div>
    </div>
  );
}
