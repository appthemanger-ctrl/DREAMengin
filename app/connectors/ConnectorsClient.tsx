'use client';
/**
 * app/connectors/ConnectorsClient.tsx
 *
 * Phase 5 — Client-side connector manager.
 * Loads real connector statuses from /api/connectors/status on mount so
 * previously connected services show their actual state from connector_accounts.
 * Shows Sync Now button for connected tier-1 providers.
 *
 * Groups: Tier 1 (Supported), Tier 2 (Requires Approval / Setup), Tier 3 (Unsupported).
 *
 * ARCHITECTURE.md §3 — Component layer; logic lives in lib/ and API routes.
 * AXIOMS.md §3 — Every visible action does something real.
 */

import React, { useState, useEffect } from 'react';
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
import { RefreshCw } from 'lucide-react';

// Demo initial grid: 6 slots, all empty
const DEMO_GRID: SlotGrid = { totalSlots: 6, filledSlots: new Set() };

// Registry defaults — used as the initial value before real DB statuses load
const DEFAULT_STATUSES: Record<string, ConnectorStatus> = Object.fromEntries(
  CONNECTOR_REGISTRY.map((c) => [c.id, c.defaultStatus]),
);

const TIER1_IDS = new Set(CONNECTOR_REGISTRY.filter((c) => c.tier === 'tier1').map((c) => c.id));

// ── Sync button ────────────────────────────────────────────────────────────

function SyncButton({ connectorId, connectorName }: { connectorId: string; connectorName: string }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/connectors/${connectorId}/sync`, { method: 'POST' });
      const data = await res.json() as { ok: boolean; fetched?: number; last_synced_at?: string; error?: string };
      if (data.ok) {
        setLastSynced(data.last_synced_at ?? new Date().toISOString());
      } else {
        setSyncError(data.error ?? 'Sync failed.');
      }
    } catch {
      setSyncError('Network error — please try again.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
      <button
        type="button"
        disabled={syncing}
        onClick={handleSync}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 8,
          background: 'rgba(160,195,240,0.15)',
          border: '1px solid rgba(160,195,240,0.25)',
          color: 'var(--de-accent)', fontSize: 11, fontWeight: 600,
          cursor: syncing ? 'not-allowed' : 'pointer',
          opacity: syncing ? 0.7 : 1,
        }}
      >
        <RefreshCw size={10} style={{ animation: syncing ? 'de-spin 1s linear infinite' : 'none' }} />
        {syncing ? 'Syncing…' : `Sync ${connectorName}`}
      </button>
      {lastSynced && (
        <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>
          Last synced {new Date(lastSynced).toLocaleTimeString()}
        </span>
      )}
      {syncError && (
        <span style={{ fontSize: 10, color: '#dc4444' }}>{syncError}</span>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ConnectorsClient() {
  const [menuOpen] = useState(false);
  const [slices, setSlices] = useState<FeedSlice[]>([]);
  const [installedWidgets, setInstalledWidgets] = useState<Array<{
    widgetId: string; dataState: WidgetDataState;
  }>>([]);
  const [grid, setGrid] = useState<SlotGrid>(DEMO_GRID);
  // Live statuses from connector_accounts — seeded with registry defaults until the fetch resolves
  const [statuses, setStatuses] = useState<Record<string, ConnectorStatus>>(DEFAULT_STATUSES);
  // Track which tier-1 connectors are connected (for showing Sync Now)
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  // Load real connector statuses from the DB on mount
  useEffect(() => {
    fetch('/api/connectors/status')
      .then((r) => r.json())
      .then((data: { ok: boolean; statuses: Record<string, { status: string }> }) => {
        if (!data.ok) return;
        setStatuses((prev) => {
          const next = { ...prev };
          for (const [provider, entry] of Object.entries(data.statuses)) {
            next[provider] = entry.status as ConnectorStatus;
          }
          return next;
        });
        // Seed connectedIds from real DB state
        const tier1Connected = new Set(
          Object.entries(data.statuses)
            .filter(([id, entry]) => entry.status === 'connected' && TIER1_IDS.has(id))
            .map(([id]) => id),
        );
        setConnectedIds(tier1Connected);
      })
      .catch(() => { /* keep registry defaults on network error */ });
  }, []);

  function handleAutoLock() {
    // Caller is responsible for locking to LOCKED / safe mode
  }

  const flow = useConnectorInstallFlow({
    grid,
    onAutoLock: handleAutoLock,
    isMenuOpen: menuOpen,
  });

  function handlePromptAdd(widgetId: string) {
    flow.onPromptAdd(widgetId);
  }

  function handlePlacementDone(slot: number) {
    if (flow.placementRequest) {
      setGrid((prev) => ({
        ...prev,
        filledSlots: new Set([...prev.filledSlots, slot]),
      }));
      setInstalledWidgets((prev) => [
        ...prev,
        { widgetId: flow.placementRequest!.widgetId, dataState: 'loading' },
      ]);
      const wid = flow.placementRequest.widgetId;
      setTimeout(() => {
        setInstalledWidgets((prev) =>
          prev.map((w) => w.widgetId === wid ? { ...w, dataState: 'ready' } : w),
        );
      }, 1500);
    }
    flow.onPlacementDone(slot);
  }

  function handleConnectSuccess(connectorId: string, connectorName: string) {
    // Add to connected set so Sync Now button appears
    if (TIER1_IDS.has(connectorId)) {
      setConnectedIds((prev) => new Set([...prev, connectorId]));
    }
    flow.onConnectSuccess(connectorId, connectorName);
  }

  function handleDisconnect(connectorId: string) {
    // Remove from connected set so Sync Now button disappears
    setConnectedIds((prev) => {
      const next = new Set(prev);
      next.delete(connectorId);
      return next;
    });
  }

  React.useEffect(() => {
    if (flow.placementRequest && !flow.placementRequest.noSlotAvailable) {
      const slots = grid.filledSlots;
      let bestSlot = -1;
      for (let i = 0; i < grid.totalSlots; i++) {
        if (!slots.has(i)) { bestSlot = i; break; }
      }
      if (bestSlot >= 0) handlePlacementDone(bestSlot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.placementRequest?.widgetId, flow.placementRequest?.noSlotAvailable]);

  // Group connectors by tier for display
  const tier1 = CONNECTOR_REGISTRY.filter((c) => c.tier === 'tier1');
  const tier2 = CONNECTOR_REGISTRY.filter((c) => c.tier === 'tier2');
  const tier3 = CONNECTOR_REGISTRY.filter((c) => c.tier === 'tier3');

  return (
    <>
      {/* ── Tier 1: Fully supported ──────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <span className="de-widget-title">✅ Supported Connections</span>
        </div>
        <div className="de-widget-body" style={{ padding: '4px 6px' }}>
          {tier1.map((conn) => (
            <div key={conn.id}>
              <ConnectorRow
                connector={conn}
                status={statuses[conn.id]}
                onConnectSuccess={handleConnectSuccess}
                onDisconnect={handleDisconnect}
              />
              {connectedIds.has(conn.id) && (
                <SyncButton connectorId={conn.id} connectorName={conn.name} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tier 2: Gated (requires approval or admin setup) ─────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <span className="de-widget-title">⚙️ Requires Approval or Setup</span>
        </div>
        <div className="de-widget-body" style={{ padding: '4px 6px' }}>
          {tier2.map((conn) => (
            <ConnectorRow
              key={conn.id}
              connector={conn}
              status={statuses[conn.id]}
              onConnectSuccess={handleConnectSuccess}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      </div>

      {/* ── Tier 3: Unsupported ──────────────────────────────────────── */}
      <div className="de-widget">
        <div className="de-widget-header">
          <span className="de-widget-title">🚫 Not Available via Official API</span>
        </div>
        <div className="de-widget-body" style={{ padding: '4px 6px' }}>
          {tier3.map((conn) => (
            <ConnectorRow
              key={conn.id}
              connector={conn}
              status={statuses[conn.id]}
              onConnectSuccess={handleConnectSuccess}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
        <div className="de-widget-body" style={{ paddingTop: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)', padding: '4px 6px 8px', lineHeight: 1.5 }}>
            These platforms do not expose a public API for the data shown.
            Consider using <strong>Mastodon</strong>, <strong>Bluesky</strong>, or <strong>Nostr</strong> for full follow/feed access.
          </div>
        </div>
      </div>

      {/* ── Installed widget shells ──────────────────────────────────── */}
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

      {/* ── Toast ────────────────────────────────────────────────────── */}
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

      {/* ── Widget install prompt ─────────────────────────────────────── */}
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

      {/* ── No-slot dialog ────────────────────────────────────────────── */}
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

      {/* ── Placement mode ────────────────────────────────────────────── */}
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

      {/* ── Feed slice sheet ──────────────────────────────────────────── */}
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
        @keyframes de-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
