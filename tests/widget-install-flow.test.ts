// tests/widget-install-flow.test.ts
// Unit tests for the Connect → Widget Install flow (req 1-100)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  findBestSlot,
  handleConnectSuccess,
  handleDismissPrompt,
  handleAddWidget,
  handlePlaceLater,
  queueSuggestedWidget,
  getSuggestedWidgets,
  dismissSuggestedWidget,
  isSessionDismissed,
  deferPrompt,
  consumeDeferredPrompt,
  scheduleAutoLock,
  cancelAutoLock,
  _resetInstallFlowState,
  type SlotGrid,
} from '@/lib/connectors/installFlow';
import {
  getWidgetTypeDef,
  getWidgetTypesForConnector,
  resolveConnectorState,
  WIDGET_REGISTRY,
} from '@/lib/widgets/widgetRegistry';
import {
  getConnectorDef,
  CONNECTOR_REGISTRY,
} from '@/lib/connectors/connectorRegistry';

// Reset in-memory state before each test that touches the store
function resetStore() {
  _resetInstallFlowState();
}

// ── Req 43: All widget type IDs are stable strings (no raw duplicates) ──────
describe('WIDGET_REGISTRY — stable IDs (req 43)', () => {
  it('has no duplicate IDs', () => {
    const ids = WIDGET_REGISTRY.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has required fields (req 44)', () => {
    for (const w of WIDGET_REGISTRY) {
      expect(typeof w.id).toBe('string');
      expect(w.id.length).toBeGreaterThan(0);
      expect(typeof w.title).toBe('string');
      expect(typeof w.icon).toBe('string');
      expect(typeof w.description).toBe('string');
      expect(w.defaultConfig).toBeDefined();
      expect(w.permissions).toBeDefined();
      expect(['none', 'optional', 'required']).toContain(w.connectorDependency);
    }
  });

  it('widgets with required connectors declare a connectorId (req 45)', () => {
    const required = WIDGET_REGISTRY.filter((w) => w.connectorDependency === 'required');
    for (const w of required) {
      expect(typeof w.connectorId).toBe('string');
      expect((w.connectorId ?? '').length).toBeGreaterThan(0);
    }
  });
});

// ── Req 43: Connector registry stable IDs ────────────────────────────────
describe('CONNECTOR_REGISTRY — stable IDs (req 43)', () => {
  it('has no duplicate IDs', () => {
    const ids = CONNECTOR_REGISTRY.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each connector has 2–5 slice types (req 56)', () => {
    for (const c of CONNECTOR_REGISTRY) {
      expect(c.sliceTypes.length).toBeGreaterThanOrEqual(2);
      expect(c.sliceTypes.length).toBeLessThanOrEqual(5);
    }
  });
});

// ── Req 46-48: Connector state resolution ─────────────────────────────────
describe('resolveConnectorState (req 46-48)', () => {
  it('returns not_required for widgets with no connector dependency (req 46)', () => {
    const state = resolveConnectorState('feed-main', new Set(), new Set());
    expect(state).toBe('not_required');
  });

  it('returns not_connected when required connector is missing (req 46)', () => {
    const state = resolveConnectorState('yt-channel', new Set(), new Set());
    expect(state).toBe('not_connected');
  });

  it('returns connected when connector is present (req 47)', () => {
    const state = resolveConnectorState('yt-channel', new Set(['youtube']), new Set());
    expect(state).toBe('connected');
  });

  it('returns expired when connector has expired (req 48)', () => {
    const state = resolveConnectorState('yt-channel', new Set(['youtube']), new Set(['youtube']));
    expect(state).toBe('expired');
  });
});

// ── Req 32: Slot detection — nearest to centre ────────────────────────────
describe('findBestSlot (req 31-33)', () => {
  it('returns the slot nearest to center when multiple empty slots exist (req 32)', () => {
    const grid: SlotGrid = { totalSlots: 5, filledSlots: new Set([0, 1]) };
    const slot = findBestSlot(grid);
    // Center = (5-1)/2 = 2; slot 2 is empty and nearest
    expect(slot).toBe(2);
  });

  it('returns -1 when all slots are filled (req 33)', () => {
    const grid: SlotGrid = { totalSlots: 3, filledSlots: new Set([0, 1, 2]) };
    expect(findBestSlot(grid)).toBe(-1);
  });

  it('returns 0 for a single empty slot (req 31)', () => {
    const grid: SlotGrid = { totalSlots: 1, filledSlots: new Set() };
    expect(findBestSlot(grid)).toBe(0);
  });

  it('prefers the centermost of ties', () => {
    // 4 slots, all empty: center = 1.5; slots 1 and 2 tie — picks whichever sort puts first
    const grid: SlotGrid = { totalSlots: 4, filledSlots: new Set() };
    const slot = findBestSlot(grid);
    expect([1, 2]).toContain(slot); // either central slot is acceptable
  });
});

// ── Req 5, 11-20: handleConnectSuccess ────────────────────────────────────
describe('handleConnectSuccess (req 11-20)', () => {
  it('returns shouldShowPromptNow=true when nothing is blocking (req 5)', () => {
    const result = handleConnectSuccess('youtube', 'YouTube');
    expect(result.shouldShowPromptNow).toBe(true);
    expect(result.deferred).toBe(false);
  });

  it('defers when menu is open (req 16)', () => {
    const result = handleConnectSuccess('youtube', 'YouTube', { isMenuOpen: true });
    expect(result.shouldShowPromptNow).toBe(false);
    expect(result.deferred).toBe(true);
  });

  it('defers when popup is open (req 17)', () => {
    const result = handleConnectSuccess('spotify', 'Spotify', { isPopupOpen: true });
    expect(result.shouldShowPromptNow).toBe(false);
    expect(result.deferred).toBe(true);
  });

  it('defers when a prompt is already visible (req 18)', () => {
    const result = handleConnectSuccess('spotify', 'Spotify', { isPromptVisible: true });
    expect(result.shouldShowPromptNow).toBe(false);
    expect(result.deferred).toBe(true);
  });

  it('returns widget types associated with the connector (req 45)', () => {
    const result = handleConnectSuccess('youtube', 'YouTube');
    expect(result.suggestedWidgetTypes.length).toBeGreaterThan(0);
    expect(result.suggestedWidgetTypes.every((w) => w.connectorId === 'youtube')).toBe(true);
  });
});

// ── Req 16-17: Deferred prompt queue ──────────────────────────────────────
describe('deferred prompt (req 16-17)', () => {
  it('stores and consumes a deferred prompt', () => {
    deferPrompt('github', 'GitHub');
    const p = consumeDeferredPrompt();
    expect(p).toEqual({ connectorId: 'github', connectorName: 'GitHub' });
  });

  it('returns null when no deferred prompt', () => {
    const p = consumeDeferredPrompt();
    expect(p).toBeNull();
  });
});

// ── Req 7-10: Suggested Widgets store ─────────────────────────────────────
describe('SuggestedWidgets store (req 7-10, 34-35)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('queues a widget on dismiss (req 8)', () => {
    handleDismissPrompt('yt-channel', 'youtube', 'YouTube');
    const suggested = getSuggestedWidgets();
    expect(suggested.some((s) => s.widgetId === 'yt-channel')).toBe(true);
  });

  it('does not duplicate queued widgets (req 8)', () => {
    queueSuggestedWidget('yt-channel', 'youtube', 'YouTube');
    queueSuggestedWidget('yt-channel', 'youtube', 'YouTube');
    const suggested = getSuggestedWidgets();
    const count = suggested.filter((s) => s.widgetId === 'yt-channel').length;
    expect(count).toBe(1);
  });

  it('permanent dismiss removes the widget from suggestions (req 9)', () => {
    queueSuggestedWidget('spotify', 'spotify', 'Spotify');
    dismissSuggestedWidget('spotify');
    const suggested = getSuggestedWidgets();
    expect(suggested.some((s) => s.widgetId === 'spotify')).toBe(false);
  });

  it('session dismissed flag is set after queueing (req 10)', () => {
    queueSuggestedWidget('ig-friend', 'instagram', 'Instagram');
    expect(isSessionDismissed('ig-friend')).toBe(true);
  });
});

// ── Req 21-25: handleAddWidget ─────────────────────────────────────────────
describe('handleAddWidget (req 21-30)', () => {
  it('returns a valid slot when one is available (req 21, 31)', () => {
    const grid: SlotGrid = { totalSlots: 4, filledSlots: new Set([0, 1]) };
    const { slot, needsPlacementMode } = handleAddWidget(
      'feed-main', 'demo', 'Demo', grid, () => {},
    );
    expect(slot).toBeGreaterThanOrEqual(0);
    expect(needsPlacementMode).toBe(false);
  });

  it('signals needsPlacementMode when no slot is available (req 33)', () => {
    const grid: SlotGrid = { totalSlots: 2, filledSlots: new Set([0, 1]) };
    const { slot, needsPlacementMode } = handleAddWidget(
      'feed-main', 'demo', 'Demo', grid, () => {},
    );
    expect(slot).toBe(-1);
    expect(needsPlacementMode).toBe(true);
  });
});

// ── Req 84-89: scheduleAutoLock ────────────────────────────────────────────
describe('scheduleAutoLock (req 84-89)', () => {
  it('does not trigger during drag (req 85)', () => {
    vi.useFakeTimers();
    const onLock = vi.fn();
    scheduleAutoLock(onLock, { isDragging: true });
    vi.advanceTimersByTime(2000);
    expect(onLock).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('does not trigger during menu animation (req 86)', () => {
    vi.useFakeTimers();
    const onLock = vi.fn();
    scheduleAutoLock(onLock, { isMenuAnimating: true });
    vi.advanceTimersByTime(2000);
    expect(onLock).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('triggers after 1.2 s when no blockers (req 88)', () => {
    vi.useFakeTimers();
    const onLock = vi.fn();
    scheduleAutoLock(onLock);
    vi.advanceTimersByTime(1200);
    expect(onLock).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('can be cancelled (req 85-87)', () => {
    vi.useFakeTimers();
    const onLock = vi.fn();
    scheduleAutoLock(onLock);
    cancelAutoLock();
    vi.advanceTimersByTime(2000);
    expect(onLock).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

// ── Req 45: getWidgetTypesForConnector ────────────────────────────────────
describe('getWidgetTypesForConnector (req 45)', () => {
  it('returns only widgets that require youtube', () => {
    const types = getWidgetTypesForConnector('youtube');
    expect(types.length).toBeGreaterThan(0);
    expect(types.every((t) => t.connectorId === 'youtube')).toBe(true);
  });

  it('returns empty array for unknown connector', () => {
    expect(getWidgetTypesForConnector('unknown-connector')).toHaveLength(0);
  });
});

// ── Req 43: Lookup by stable ID ───────────────────────────────────────────
describe('getWidgetTypeDef / getConnectorDef (req 43)', () => {
  it('resolves a widget by stable ID', () => {
    const def = getWidgetTypeDef('yt-channel');
    expect(def).toBeDefined();
    expect(def?.title).toBe('YouTube Channel');
  });

  it('returns undefined for unknown widget ID', () => {
    expect(getWidgetTypeDef('does-not-exist')).toBeUndefined();
  });

  it('resolves a connector by stable ID', () => {
    const def = getConnectorDef('spotify');
    expect(def).toBeDefined();
    expect(def?.name).toBe('Spotify');
  });
});

// ── Req 34: handlePlaceLater queues in Suggested ──────────────────────────
describe('handlePlaceLater (req 34)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('queues widget in Suggested Widgets', () => {
    handlePlaceLater('calendar', 'demo', 'Demo');
    const suggested = getSuggestedWidgets();
    expect(suggested.some((s) => s.widgetId === 'calendar')).toBe(true);
  });
});
