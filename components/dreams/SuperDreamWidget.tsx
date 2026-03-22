'use client';
/**
 * components/dreams/SuperDreamWidget.tsx
 *
 * Real composition component for the SuperDreamWidget.
 *
 * Phase 8 Section B — Point 17:
 *   - Loads Dream Windows from the database via useDreamWindowActions
 *   - Auto-composes compatible Dream Windows into named clusters
 *     (e.g. music + star = StarMaker cluster)
 *   - Renders them in the correct layout (stack/grid based on count +
 *     compatibility)
 *   - Has real add/remove/configure actions wired to the API
 *
 * Architecture: docs/ARCHITECTURE.md §4 (Universal Dream Window model)
 * Architecture: docs/ARCHITECTURE.md §6 (Combined profile output)
 * Privacy: all windows filtered by visibility before rendering (Point 21).
 */

import { useCallback, useMemo, useState } from 'react';
import { useDreamWindowActions } from '@/lib/dream-window/useDreamWindowActions';
import type { DreamWindowRecord } from '@/types/dream-window';
import type { CreateDreamWindowBody } from '@/types/dream-window';
import { DREAM_WINDOW_STATES } from '@/lib/dream-window/DreamWindowLifecycle';

// ---------------------------------------------------------------------------
// Compatibility cluster definitions
// ---------------------------------------------------------------------------

/**
 * Auto-composition compatibility rules.
 * When two or more Dream Windows share a cluster key, they can be grouped
 * into a named "Super Dream" composition.
 *
 * Architecture: docs/ARCHITECTURE.md §6 (Compatible Dream Windows may combine
 * into automatic profile output blocks.)
 */
const COMPATIBILITY_CLUSTERS: Record<string, { label: string; clusterKey: string }> = {
  music:   { label: 'StarMaker', clusterKey: 'starmaker' },
  star:    { label: 'StarMaker', clusterKey: 'starmaker' },
  games:   { label: 'GameSphere', clusterKey: 'gamesphere' },
  game:    { label: 'GameSphere', clusterKey: 'gamesphere' },
  brand:   { label: 'BrandDream', clusterKey: 'branddream' },
  code:    { label: 'LabCode', clusterKey: 'labcode' },
  lab:     { label: 'LabCode', clusterKey: 'labcode' },
  content: { label: 'ContentStream', clusterKey: 'contentstream' },
  create:  { label: 'ContentStream', clusterKey: 'contentstream' },
};

function getCluster(type: string): { label: string; clusterKey: string } | null {
  return COMPATIBILITY_CLUSTERS[type.toLowerCase()] ?? null;
}

type ClusterGroup = {
  clusterKey: string;
  label: string;
  windows: DreamWindowRecord[];
};

function groupIntoClusters(windows: DreamWindowRecord[]): ClusterGroup[] {
  const groups = new Map<string, ClusterGroup>();

  for (const w of windows) {
    const cluster = getCluster(w.type);
    const key = cluster?.clusterKey ?? w.type;
    const label = cluster?.label ?? w.type;

    if (!groups.has(key)) {
      groups.set(key, { clusterKey: key, label, windows: [] });
    }
    groups.get(key)!.windows.push(w);
  }

  return Array.from(groups.values());
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DreamWindowTile({
  window: w,
  onRemove,
  onBind,
  onCollapse,
}: {
  window: DreamWindowRecord;
  onRemove: (id: string) => void;
  onBind: (id: string) => void;
  onCollapse: (id: string) => void;
}) {
  const label =
    typeof w.config?.label === 'string' ? w.config.label : w.type;

  const stateColor: Record<string, string> = {
    [DREAM_WINDOW_STATES.UNBOUND]:   '#94a3b8',
    [DREAM_WINDOW_STATES.BOUND]:     '#60a5fa',
    [DREAM_WINDOW_STATES.MOUNTED]:   '#4ade80',
    [DREAM_WINDOW_STATES.COLLAPSED]: '#fbbf24',
  };

  return (
    <div
      className="de-surface"
      style={{
        padding: '10px 14px',
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--de-text)' }}>
          {label}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: stateColor[w.active_state] ?? '#94a3b8',
            background: 'rgba(0,0,0,0.08)',
            borderRadius: 99,
            padding: '2px 8px',
          }}
        >
          {w.active_state.replace(' Dream Window', '')}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {w.active_state === DREAM_WINDOW_STATES.UNBOUND && (
          <button
            type="button"
            onClick={() => onBind(w.id)}
            style={actionBtn('#60a5fa')}
          >
            Bind
          </button>
        )}
        {w.active_state === DREAM_WINDOW_STATES.MOUNTED && (
          <button
            type="button"
            onClick={() => onCollapse(w.id)}
            style={actionBtn('#fbbf24')}
          >
            Collapse
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(w.id)}
          style={actionBtn('#f87171')}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function actionBtn(color: string): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    color,
    background: `${color}20`,
    border: `1px solid ${color}40`,
    borderRadius: 8,
    padding: '3px 10px',
    cursor: 'pointer',
  };
}

function ClusterCard({ group, onRemove, onBind, onCollapse }: {
  group: ClusterGroup;
  onRemove: (id: string) => void;
  onBind: (id: string) => void;
  onCollapse: (id: string) => void;
}) {
  const layout = group.windows.length > 2 ? 'grid' : 'stack';

  return (
    <div className="de-widget" style={{ marginBottom: 12 }}>
      <div
        style={{
          padding: '8px 14px',
          borderBottom: '1px solid rgba(160,195,240,0.15)',
          fontWeight: 700,
          fontSize: 12,
          color: 'var(--de-text-dim)',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        ✦ {group.label}
      </div>
      <div
        style={{
          padding: 12,
          display: 'grid',
          gap: 10,
          gridTemplateColumns:
            layout === 'grid' ? 'repeat(2, minmax(0, 1fr))' : '1fr',
        }}
      >
        {group.windows.map((w) => (
          <DreamWindowTile
            key={w.id}
            window={w}
            onRemove={onRemove}
            onBind={onBind}
            onCollapse={onCollapse}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface SuperDreamWidgetProps {
  /** Optional filter: only show Dream Windows of these types */
  types?: string[];
  /** Optional title override */
  title?: string;
}

export default function SuperDreamWidget({
  types,
  title = 'Dream Windows',
}: SuperDreamWidgetProps) {
  const {
    dreamWindows,
    isLoading,
    error,
    addWindow,
    removeWindow,
    bindWindow,
    collapseWindow,
  } = useDreamWindowActions();

  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState('');

  // Filter by requested types if supplied
  const filtered = useMemo(
    () =>
      types && types.length > 0
        ? dreamWindows.filter((w) => types.includes(w.type))
        : dreamWindows,
    [dreamWindows, types],
  );

  const clusters = useMemo(() => groupIntoClusters(filtered), [filtered]);

  const handleAdd = useCallback(async () => {
    if (!newType.trim()) return;
    const body: CreateDreamWindowBody = {
      id: crypto.randomUUID(),
      type: newType.trim(),
      owner_id: '', // filled at API layer from auth session
      config: { label: newType.trim() },
      size: { width: 320, height: 240 },
      position: { x: 0, y: 0 },
      visibility: 'private',
      sourceBindings: [],
      destinationRules: [],
      activeState: DREAM_WINDOW_STATES.UNBOUND,
    };
    const result = await addWindow(body);
    if (result) {
      setNewType('');
      setAdding(false);
    }
  }, [addWindow, newType]);

  return (
    <section className="de-widget" data-super-dream-widget>
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(160,195,240,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span className="de-widget-title">{title}</span>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          style={{
            fontSize: 18,
            lineHeight: 1,
            color: 'var(--de-accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
          }}
          aria-label="Add Dream Window"
        >
          +
        </button>
      </div>

      {adding && (
        <div
          style={{
            padding: '10px 14px',
            display: 'flex',
            gap: 8,
            borderBottom: '1px solid rgba(160,195,240,0.15)',
          }}
        >
          <input
            type="text"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Type (e.g. music, code)"
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid rgba(160,195,240,0.35)',
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--de-text)',
              fontSize: 13,
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            type="button"
            onClick={handleAdd}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: 'var(--de-accent)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>
      )}

      <div style={{ padding: 12 }}>
        {isLoading && (
          <div style={{ color: 'var(--de-text-dim)', fontSize: 13, textAlign: 'center', padding: 16 }}>
            Loading Dream Windows…
          </div>
        )}

        {!isLoading && error && (
          <div style={{ color: '#f87171', fontSize: 13, padding: 12 }}>
            {error}
          </div>
        )}

        {!isLoading && !error && clusters.length === 0 && (
          <div style={{ color: 'var(--de-text-dim)', fontSize: 13, textAlign: 'center', padding: 16 }}>
            No Dream Windows yet. Tap + to add one.
          </div>
        )}

        {clusters.map((group) => (
          <ClusterCard
            key={group.clusterKey}
            group={group}
            onRemove={removeWindow}
            onBind={bindWindow}
            onCollapse={collapseWindow}
          />
        ))}
      </div>
    </section>
  );
}

