'use client';
// app/connectors/ConnectorsClient.tsx
// Client-side wrapper that wires up the Connect → Widget Install flow (req 1-100)

import React, { useState } from 'react';
import { CONNECTOR_REGISTRY } from '@/lib/connectors/connectorRegistry';
import type { ConnectorStatus } from '@/lib/connectors/connectorRegistry';
import ConnectorRow from '@/components/connectors/ConnectorRow';
import ConnectWidgetPrompt from '@/components/connectors/ConnectWidgetPrompt';
import AddSliceSheet from '@/components/connectors/AddSliceSheet';
import PlacementMode from '@/components/connectors/PlacementMode';
import NoSlotDialog from '@/components/connectors/NoSlotDialog';
import WidgetShell from '@/components/widgets/WidgetShell';
import type { WidgetDataState } from '@/components/widgets/WidgetShell';
import { getWidgetTypeDef } from '@/lib/widgets/widgetRegistry';
import { getConnectorDef } from '@/lib/connectors/connectorRegistry';
import { useConnectorInstallFlow } from '@/hooks/useConnectorInstallFlow';
import type { SlotGrid } from '@/lib/connectors/installFlow';
import type { FeedSlice } from '@/components/connectors/AddSliceSheet';

// Demo initial grid: 6 slots, all empty
const DEMO_GRID: SlotGrid = { totalSlots: 6, filledSlots: new Set() };

const INITIAL_STATUSES: Record<string, ConnectorStatus> = Object.fromEntries(
  CONNECTOR_REGISTRY.map((c) => [c.id, 'not_connected']),
);

const CATEGORIES = [
  'Social', 'Music', 'Video', 'Gaming', 'Storage', 'Calendar',
  'Productivity', 'Health', 'News', 'Finance', 'Travel', 'Food',
  'Smart Home', 'Education', 'Development', 'Analytics', 'Utilities',
] as const;

export default function ConnectorsClient() {
  const [menuOpen] = useState(false);
  const [slices, setSlices] = useState<FeedSlice[]>([]);
  // Widgets that have been installed (for display) — req 21-30
  const [installedWidgets, setInstalledWidgets] = useState<Array<{
    widgetId: string; dataState: WidgetDataState;
  }>>([]);
  const [grid, setGrid] = useState<SlotGrid>(DEMO_GRID);

  // Auto-lock handler (req 84-90): in a real app this calls a navigation state setter
  function handleAutoLock() {
    // Caller is responsible for locking to LOCKED / safe mode (req 83-84)
  }

  const flow = useConnectorInstallFlow({
    grid,
    onAutoLock: handleAutoLock,
    isMenuOpen: menuOpen,
  });

  // When a widget is added, update the grid and installedWidgets list
  function handlePromptAdd(widgetId: string) {
    flow.onPromptAdd(widgetId);
  }

  function handlePlacementDone(slot: number) {
    if (flow.placementRequest) {
      // Mark slot as filled
      setGrid((prev) => ({
        ...prev,
        filledSlots: new Set([...prev.filledSlots, slot]),
      }));
      setInstalledWidgets((prev) => [
        ...prev,
        { widgetId: flow.placementRequest!.widgetId, dataState: 'loading' },
      ]);
      // Simulate async data arriving after 1.5s (req 27)
      const wid = flow.placementRequest.widgetId;
      setTimeout(() => {
        setInstalledWidgets((prev) =>
          prev.map((w) => w.widgetId === wid ? { ...w, dataState: 'ready' } : w),
        );
      }, 1500);
    }
    flow.onPlacementDone(slot);
  }

  // If prompt was adding to auto-slot (not placement mode), apply it now
  React.useEffect(() => {
    if (flow.placementRequest && !flow.placementRequest.noSlotAvailable) {
      // Auto-placed into a slot (req 31) — find best slot
      const slots = grid.filledSlots;
      let bestSlot = -1;
      for (let i = 0; i < grid.totalSlots; i++) {
        if (!slots.has(i)) { bestSlot = i; break; }
      }
      if (bestSlot >= 0) handlePlacementDone(bestSlot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.placementRequest?.widgetId, flow.placementRequest?.noSlotAvailable]);

  return (
    <>
      {/* Connector list */}
      {CATEGORIES.map((cat) => {
        const items = CONNECTOR_REGISTRY.filter((c) => c.category === cat);
        if (!items.length) return null;
        return (
          <div key={cat} className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">{cat}</span></div>
            <div className="de-widget-body" style={{ padding: '4px 6px' }}>
              {items.map((conn) => (
                <ConnectorRow
                  key={conn.id}
                  connector={conn}
                  status={INITIAL_STATUSES[conn.id]}
                  onConnectSuccess={flow.onConnectSuccess}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Installed widget shells (req 21-30) */}
      {installedWidgets.length > 0 && (
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Your Widgets</span></div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {installedWidgets.map((w) => {
              const def = getWidgetTypeDef(w.widgetId);
              if (!def) return null;
              return (
                <WidgetShell
                  key={w.widgetId}
                  widgetId={w.widgetId}
                  title={def.title}
                  icon={def.icon}
                  dataState={w.dataState}
                  onRetry={() => {
                    setInstalledWidgets((prev) =>
                      prev.map((x) => x.widgetId === w.widgetId ? { ...x, dataState: 'loading' } : x),
                    );
                    setTimeout(() => {
                      setInstalledWidgets((prev) =>
                        prev.map((x) => x.widgetId === w.widgetId ? { ...x, dataState: 'ready' } : x),
                      );
                    }, 1200);
                  }}
                >
                  <div style={{ padding: '8px 4px', fontSize: 12, color: 'var(--de-text-dim)' }}>
                    {def.description}
                  </div>
                </WidgetShell>
              );
            })}
          </div>
        </div>
      )}

      {/* Toast (req 11) */}
      {flow.toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom,0px) + 96px)',
            left: '50%', transform: 'translateX(-50%)',
            zIndex: 65,
            background: 'rgba(34,197,94,0.95)',
            backdropFilter: 'blur(12px)',
            color: '#fff', fontSize: 13, fontWeight: 700,
            padding: '10px 20px', borderRadius: 999,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            animation: 'de-slide-up 200ms ease',
            pointerEvents: 'none',
          }}
        >
          ✓ {flow.toastMessage}
        </div>
      )}

      {/* Widget install prompt (req 12-20) — one at a time (req 18) */}
      {flow.prompt && (
        <ConnectWidgetPrompt
          connectorId={flow.prompt.connectorId}
          connectorName={flow.prompt.connectorName}
          widgetTypes={flow.prompt.widgetTypes}
          menuOpen={menuOpen}
          onAdd={handlePromptAdd}
          onDismiss={flow.onPromptDismiss}
          onAddSlice={flow.onPromptAddSlice}
        />
      )}

      {/* No-slot dialog (req 33) */}
      {flow.placementRequest?.noSlotAvailable && (() => {
        const def = getWidgetTypeDef(flow.placementRequest.widgetId);
        if (!def) return null;
        return (
          <NoSlotDialog
            widget={def}
            onPlaceNow={() => flow.onPlaceNow(def.id)}
            onLater={() => flow.onPlaceLater(def.id, flow.placementRequest!.connectorId, flow.placementRequest!.connectorName)}
          />
        );
      })()}

      {/* Placement mode (req 36-40) */}
      {flow.placementRequest && !flow.placementRequest.noSlotAvailable && (() => {
        const def = getWidgetTypeDef(flow.placementRequest.widgetId);
        if (!def) return null;
        return (
          <PlacementMode
            widget={def}
            totalSlots={grid.totalSlots}
            filledSlots={grid.filledSlots}
            onDone={({ slot }) => handlePlacementDone(slot)}
            onCancel={flow.onPlacementCancel}
            onAutoLock={handleAutoLock}
          />
        );
      })()}

      {/* Feed Slice sheet (req 51-60) */}
      {flow.sliceSheetConnectorId && (() => {
        const connDef = getConnectorDef(flow.sliceSheetConnectorId);
        if (!connDef) return null;
        return (
          <AddSliceSheet
            connector={connDef}
            existingSlices={slices}
            onAdd={(slice) =>
              setSlices((prev) => [...prev, { ...slice, order: prev.length }])
            }
            onClose={() => flow.onPromptAddSlice('')}
          />
        );
      })()}

      <style>{`
        @keyframes de-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
