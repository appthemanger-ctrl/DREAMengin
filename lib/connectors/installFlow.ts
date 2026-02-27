// lib/connectors/installFlow.ts
// Core logic for the Connect → Widget Install flow (req 1-40, 71-90)
//
// This module is pure (no React, no DOM) so it is fully unit-testable.

import { getWidgetTypesForConnector } from '@/lib/widgets/widgetRegistry';
import { track } from '@/lib/telemetry';

// ── Slot helpers (req 31-33) ──────────────────────────────────────────────

export interface SlotGrid {
  totalSlots: number;
  filledSlots: Set<number>;
}

/**
 * Find the best empty slot for a new widget.
 * Priority: nearest to centre (req 32).
 * Returns -1 if no empty slot exists (req 33).
 */
export function findBestSlot(grid: SlotGrid): number {
  const { totalSlots, filledSlots } = grid;
  const empty: number[] = [];
  for (let i = 0; i < totalSlots; i++) {
    if (!filledSlots.has(i)) empty.push(i);
  }
  if (empty.length === 0) return -1;

  // "Center" is (totalSlots - 1) / 2
  const centre = (totalSlots - 1) / 2;
  empty.sort((a, b) => Math.abs(a - centre) - Math.abs(b - centre));
  return empty[0];
}

// ── Suggested Widgets store (req 8-9, 34-35) ─────────────────────────────
// In-memory store used as primary; persisted to localStorage when available.

const SESSION_DISMISSED = new Set<string>(); // req 10: no repeats in same session

function suggestedKey(): string {
  return 'de_suggested_widgets';
}
function permanentDismissKey(): string {
  return 'de_dismissed_widgets';
}

export interface SuggestedWidget {
  widgetId: string;
  connectorId: string;
  connectorName: string;
  addedAt: number;
}

// In-memory stores (primary — always authoritative; localStorage is a mirror)
const _suggestedInMemory: SuggestedWidget[] = [];
const _permanentlyDismissedInMemory = new Set<string>();

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function loadSuggested(): SuggestedWidget[] {
  if (!hasLocalStorage()) return [..._suggestedInMemory];
  try {
    const persisted: SuggestedWidget[] = JSON.parse(localStorage.getItem(suggestedKey()) ?? '[]');
    // Merge persisted into in-memory (de-dup)
    for (const p of persisted) {
      if (!_suggestedInMemory.some((s) => s.widgetId === p.widgetId && s.connectorId === p.connectorId)) {
        _suggestedInMemory.push(p);
      }
    }
    return [..._suggestedInMemory];
  } catch {
    return [..._suggestedInMemory];
  }
}

function saveSuggested(items: SuggestedWidget[]): void {
  // Always keep in-memory store in sync
  _suggestedInMemory.length = 0;
  _suggestedInMemory.push(...items);
  if (!hasLocalStorage()) return;
  try {
    localStorage.setItem(suggestedKey(), JSON.stringify(items));
  } catch { /* quota exceeded or private mode */ }
}

function loadPermanentlyDismissed(): Set<string> {
  if (!hasLocalStorage()) return new Set(_permanentlyDismissedInMemory);
  try {
    const arr: string[] = JSON.parse(localStorage.getItem(permanentDismissKey()) ?? '[]');
    for (const id of arr) _permanentlyDismissedInMemory.add(id);
    return new Set(_permanentlyDismissedInMemory);
  } catch {
    return new Set(_permanentlyDismissedInMemory);
  }
}

function savePermanentlyDismissed(ids: Set<string>): void {
  _permanentlyDismissedInMemory.clear();
  for (const id of ids) _permanentlyDismissedInMemory.add(id);
  if (!hasLocalStorage()) return;
  try {
    localStorage.setItem(permanentDismissKey(), JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

/** Queue a widget in "Suggested Widgets" (req 8, 34-35) */
export function queueSuggestedWidget(
  widgetId: string,
  connectorId: string,
  connectorName: string,
): void {
  const items = loadSuggested();
  const already = items.some((s) => s.widgetId === widgetId && s.connectorId === connectorId);
  if (!already) {
    items.push({ widgetId, connectorId, connectorName, addedAt: Date.now() });
    saveSuggested(items);
  }
  SESSION_DISMISSED.add(widgetId); // req 10: don't show again this session
}

/** Get all currently queued suggestions (req 35) */
export function getSuggestedWidgets(): SuggestedWidget[] {
  const dismissed = loadPermanentlyDismissed();
  return loadSuggested().filter((s) => !dismissed.has(s.widgetId));
}

/** Permanently dismiss a suggestion (req 9) */
export function dismissSuggestedWidget(widgetId: string): void {
  const dismissed = loadPermanentlyDismissed();
  dismissed.add(widgetId);
  savePermanentlyDismissed(dismissed);
  SESSION_DISMISSED.add(widgetId);
  track('suggest_dismissed', { widgetId });

  const items = loadSuggested().filter((s) => s.widgetId !== widgetId);
  saveSuggested(items);
}

/** Remove a widget from the suggested queue (after it has been installed) */
export function removeSuggestedWidget(widgetId: string): void {
  const items = loadSuggested().filter((s) => s.widgetId !== widgetId);
  saveSuggested(items);
}

/** Whether this widget has been shown/dismissed in the current session (req 10) */
export function isSessionDismissed(widgetId: string): boolean {
  return SESSION_DISMISSED.has(widgetId);
}

/**
 * Reset all in-memory state — for use in tests only.
 * @internal
 */
export function _resetInstallFlowState(): void {
  _suggestedInMemory.length = 0;
  _permanentlyDismissedInMemory.clear();
  SESSION_DISMISSED.clear();
  _deferred = null;
  _placementQueue.length = 0;
  if (_autoLockTimer !== null) { clearTimeout(_autoLockTimer); _autoLockTimer = null; }
}

// ── Prompt deferred queue (req 16-17) ────────────────────────────────────
// Prompts deferred because a menu / popup is open are queued here.

interface DeferredPrompt {
  connectorId: string;
  connectorName: string;
}
let _deferred: DeferredPrompt | null = null;

export function deferPrompt(connectorId: string, connectorName: string): void {
  _deferred = { connectorId, connectorName };
}

export function consumeDeferredPrompt(): DeferredPrompt | null {
  const p = _deferred;
  _deferred = null;
  return p;
}

// ── Placement queue (req 33-34) ───────────────────────────────────────────
interface QueuedPlacement {
  widgetId: string;
  connectorId: string;
  connectorName: string;
}
const _placementQueue: QueuedPlacement[] = [];

export function enqueueForPlacement(widgetId: string, connectorId: string, connectorName: string): void {
  _placementQueue.push({ widgetId, connectorId, connectorName });
}

export function dequeueNextPlacement(): QueuedPlacement | undefined {
  return _placementQueue.shift();
}

export function peekPlacementQueue(): QueuedPlacement[] {
  return [..._placementQueue];
}

// ── Auto-lock timer (req 84-89) ───────────────────────────────────────────
const AUTO_LOCK_DELAY_MS = 1200; // req 88: consistent 1.2s

let _autoLockTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedule auto-lock to LOCKED / safe mode after 1.2 s.
 * Cancelled if called during drag, menu-animation, or keyboard (req 85-87).
 */
export function scheduleAutoLock(
  onLock: () => void,
  opts: { isDragging?: boolean; isMenuAnimating?: boolean; isKeyboardOpen?: boolean } = {},
): void {
  if (opts.isDragging || opts.isMenuAnimating || opts.isKeyboardOpen) return; // req 85-87

  if (_autoLockTimer !== null) clearTimeout(_autoLockTimer);
  _autoLockTimer = setTimeout(() => {
    _autoLockTimer = null;
    onLock();
    track('auto_lock', {});
  }, AUTO_LOCK_DELAY_MS);
}

export function cancelAutoLock(): void {
  if (_autoLockTimer !== null) {
    clearTimeout(_autoLockTimer);
    _autoLockTimer = null;
  }
}

// ── Connect success handler (req 1-20, 51-60) ────────────────────────────

export interface ConnectSuccessOptions {
  /** Whether a menu is currently open (req 16) */
  isMenuOpen?: boolean;
  /** Whether a popup (Messaging/DrEams) is open (req 17) */
  isPopupOpen?: boolean;
  /** Whether a prompt is already visible (req 18) */
  isPromptVisible?: boolean;
  /** Whether user is in NAV mode (req 15) */
  isNavMode?: boolean;
}

export interface ConnectSuccessResult {
  /** Widget types associated with this connector (req 5, 12) */
  suggestedWidgetTypes: ReturnType<typeof getWidgetTypesForConnector>;
  /** Whether the prompt should be shown now or deferred */
  shouldShowPromptNow: boolean;
  /** Whether the prompt was deferred */
  deferred: boolean;
}

/**
 * Called when a connector reports a successful auth.
 * Decides whether to show the install prompt immediately or defer it (req 11-20).
 * Caller must separately trigger the "Connected to {Service}" toast (req 11).
 */
export function handleConnectSuccess(
  connectorId: string,
  connectorName: string,
  opts: ConnectSuccessOptions = {},
): ConnectSuccessResult {
  track('connect_success', { connectorId, connectorName });

  const suggestedWidgetTypes = getWidgetTypesForConnector(connectorId);

  // req 16: defer if menu open
  // req 17: defer if popup open
  if (opts.isMenuOpen || opts.isPopupOpen) {
    deferPrompt(connectorId, connectorName);
    return { suggestedWidgetTypes, shouldShowPromptNow: false, deferred: true };
  }

  // req 18: only one prompt at a time
  if (opts.isPromptVisible) {
    deferPrompt(connectorId, connectorName);
    return { suggestedWidgetTypes, shouldShowPromptNow: false, deferred: true };
  }

  return { suggestedWidgetTypes, shouldShowPromptNow: true, deferred: false };
}

/**
 * Called when the user taps "Not now" on the install prompt (req 7-8).
 * Adds to Suggested Widgets so nothing is lost; never nags again this session.
 */
export function handleDismissPrompt(widgetId: string, connectorId: string, connectorName: string): void {
  track('dismiss_prompt', { widgetId, connectorId, connectorName });
  queueSuggestedWidget(widgetId, connectorId, connectorName);
}

/**
 * Called when the user taps "Add" (req 21).
 * Returns the slot to place into, or -1 if no slots available.
 * Schedules auto-lock after installation (req 83).
 */
export function handleAddWidget(
  widgetId: string,
  connectorId: string,
  connectorName: string,
  grid: SlotGrid,
  onAutoLock: () => void,
  opts: Parameters<typeof scheduleAutoLock>[1] = {},
): { slot: number; needsPlacementMode: boolean } {
  track('add_widget', { widgetId, connectorId, connectorName });
  removeSuggestedWidget(widgetId);

  const slot = findBestSlot(grid);
  const needsPlacementMode = slot === -1; // req 33

  if (needsPlacementMode) {
    enqueueForPlacement(widgetId, connectorId, connectorName);
    track('placement_mode_enter', { widgetId });
  } else {
    scheduleAutoLock(onAutoLock, opts); // req 83
  }

  return { slot, needsPlacementMode };
}

/**
 * Called when the user selects "Later" in the no-slots flow (req 34).
 */
export function handlePlaceLater(widgetId: string, connectorId: string, connectorName: string): void {
  queueSuggestedWidget(widgetId, connectorId, connectorName);
}

/**
 * Called when the user finishes placement mode (Done) (req 36-40).
 * scheduleAutoLock to LOCKED (req 40).
 */
export function handlePlacementDone(onAutoLock: () => void, opts: Parameters<typeof scheduleAutoLock>[1] = {}): void {
  track('placement_mode_exit', { result: 'done' });
  scheduleAutoLock(onAutoLock, opts);
}

/**
 * Called when the user cancels placement mode (req 37).
 * Returns to LOCKED mode (req 40).
 */
export function handlePlacementCancel(onAutoLock: () => void): void {
  track('placement_mode_exit', { result: 'cancel' });
  scheduleAutoLock(onAutoLock);
}
