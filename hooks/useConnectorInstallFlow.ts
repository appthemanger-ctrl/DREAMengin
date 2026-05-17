// hooks/useConnectorInstallFlow.ts
// React hook that orchestrates the full Connect → Widget Install flow (req 1-100)
//
// Usage:
//   const flow = useConnectorInstallFlow({ onAutoLock, grid, isMenuOpen, isPopupOpen });
//   // After connector auth succeeds:
//   flow.onConnectSuccess('youtube', 'YouTube');

'use client';

import { useCallback, useRef, useState } from 'react';
import type { WidgetTypeDef } from '@/lib/widgets/widgetRegistry';
import { getWidgetTypeDef } from '@/lib/widgets/widgetRegistry';
import { getConnectorDef } from '@/lib/connectors/connectorRegistry';
import {
  handleConnectSuccess,
  handleDismissPrompt,
  handleAddWidget,
  handlePlaceLater,
  consumeDeferredPrompt,
  type SlotGrid,
} from '@/lib/connectors/installFlow';

// ── Types ──────────────────────────────────────────────────────────────────
export interface ConnectorInstallFlowOptions {
  /** Live slot grid — used for slot detection (req 31-33) */
  grid: SlotGrid;
  /** Called when auto-lock fires (req 84-90) */
  onAutoLock: () => void;
  /** Whether any menu is currently open (req 16) */
  isMenuOpen?: boolean;
  /** Whether a popup (Messaging / DrEams) is open (req 17) */
  isPopupOpen?: boolean;
  /** Whether user is in NAV mode (req 15) */
  isNavMode?: boolean;
  /** Whether any prompt is already visible — enforced outside if multiple connectors connect (req 18) */
  isDragging?: boolean;
  isMenuAnimating?: boolean;
  isKeyboardOpen?: boolean;
}

export interface ActivePrompt {
  connectorId: string;
  connectorName: string;
  connectorIcon: string;
  widgetTypes: WidgetTypeDef[];
}

export interface PlacementRequest {
  widgetId: string;
  connectorId: string;
  connectorName: string;
  noSlotAvailable: boolean;
}

export interface ConnectorInstallFlowState {
  /** Toast message to display (req 11) */
  toastMessage: string | null;
  /** Active install prompt (req 12-20) */
  prompt: ActivePrompt | null;
  /** Placement mode request (req 33-40) */
  placementRequest: PlacementRequest | null;
  /** Slice sheet request (req 51-60) */
  sliceSheetConnectorId: string | null;
}

export interface ConnectorInstallFlowActions {
  /** Call after a connector auth succeeds */
  onConnectSuccess: (connectorId: string, connectorName: string) => void;
  /** Call when user taps "Add" on the prompt */
  onPromptAdd: (widgetId: string) => void;
  /** Call when user taps "Not now" on the prompt */
  onPromptDismiss: (widgetId: string) => void;
  /** Call when user taps "Add as Feed Slice" */
  onPromptAddSlice: (connectorId: string) => void;
  /** Call when placement mode finishes (Done) */
  onPlacementDone: (slot: number) => void;
  /** Call when placement mode is cancelled */
  onPlacementCancel: () => void;
  /** Call when no-slot dialog: user chooses "Place now" */
  onPlaceNow: (widgetId: string) => void;
  /** Call when no-slot dialog: user chooses "Later" */
  onPlaceLater: (widgetId: string, connectorId: string, connectorName: string) => void;
  /** Dismiss the current toast */
  clearToast: () => void;
  /** Call when a menu closes — checks for deferred prompt (req 16) */
  onMenuClose: () => void;
  /** Call when a popup closes — checks for deferred prompt (req 17) */
  onPopupClose: () => void;
}

export function useConnectorInstallFlow(
  opts: ConnectorInstallFlowOptions,
): ConnectorInstallFlowState & ConnectorInstallFlowActions {
  const {
    grid,
    onAutoLock,
    isMenuOpen = false,
    isPopupOpen = false,
    isDragging = false,
    isMenuAnimating = false,
    isKeyboardOpen = false,
  } = opts;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<ActivePrompt | null>(null);
  const [placementRequest, setPlacementRequest] = useState<PlacementRequest | null>(null);
  const [sliceSheetConnectorId, setSliceSheetConnectorId] = useState<string | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Show toast (req 11) ────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // ── Show prompt (req 12-20) ────────────────────────────────────────────
  const showPrompt = useCallback((connectorId: string, connectorName: string) => {
    const result = handleConnectSuccess(connectorId, connectorName, {
      isMenuOpen,
      isPopupOpen,
      isPromptVisible: prompt !== null,
    });
    if (!result.shouldShowPromptNow) return; // deferred or blocked

    const connDef = getConnectorDef(connectorId);
    if (!result.suggestedWidgetTypes.length) return;

    setPrompt({
      connectorId,
      connectorName,
      connectorIcon: connDef?.icon ?? '🔌',
      widgetTypes: result.suggestedWidgetTypes,
    });
  }, [isMenuOpen, isPopupOpen, prompt]);

  // ── Connect success ────────────────────────────────────────────────────
  const onConnectSuccess = useCallback((connectorId: string, connectorName: string) => {
    showToast(`Connected to ${connectorName}`); // req 11
    showPrompt(connectorId, connectorName);     // req 5
  }, [showToast, showPrompt]);

  // ── Prompt: Add ────────────────────────────────────────────────────────
  const onPromptAdd = useCallback((widgetId: string) => {
    if (!prompt) return;
    const def = getWidgetTypeDef(widgetId);
    const { slot, needsPlacementMode } = handleAddWidget(
      widgetId,
      prompt.connectorId,
      prompt.connectorName,
      grid,
      onAutoLock,
      { isDragging, isMenuAnimating, isKeyboardOpen },
    );
    setPrompt(null);

    if (needsPlacementMode) {
      // No empty slot → ask Place now / Later (req 33)
      setPlacementRequest({
        widgetId,
        connectorId: prompt.connectorId,
        connectorName: prompt.connectorName,
        noSlotAvailable: true,
      });
    } else {
      // Widget placed immediately — slot returned to caller via state
      setPlacementRequest({
        widgetId,
        connectorId: prompt.connectorId,
        connectorName: prompt.connectorName,
        noSlotAvailable: false,
      });
    }
    void def; // used by parent to render WidgetShell
  }, [prompt, grid, onAutoLock, isDragging, isMenuAnimating, isKeyboardOpen]);

  // ── Prompt: Dismiss ────────────────────────────────────────────────────
  const onPromptDismiss = useCallback((widgetId: string) => {
    if (!prompt) return;
    handleDismissPrompt(widgetId, prompt.connectorId, prompt.connectorName);
    setPrompt(null);
  }, [prompt]);

  // ── Prompt: Add as Feed Slice ──────────────────────────────────────────
  const onPromptAddSlice = useCallback((connectorId: string) => {
    setPrompt(null);
    setSliceSheetConnectorId(connectorId); // req 51
  }, []);

  // ── Placement: Done ───────────────────────────────────────────────────
  const onPlacementDone = useCallback((slot: number) => {
    if (!placementRequest) return;
    setPlacementRequest(null);
    onAutoLock(); // req 40, 83
  }, [placementRequest, onAutoLock]);

  // ── Placement: Cancel ─────────────────────────────────────────────────
  const onPlacementCancel = useCallback(() => {
    setPlacementRequest(null);
    onAutoLock(); // req 40
  }, [onAutoLock]);

  // ── No-slot dialog: Place now ─────────────────────────────────────────
  const onPlaceNow = useCallback((widgetId: string) => {
    if (!placementRequest) return;
    setPlacementRequest({
      widgetId,
      connectorId: placementRequest.connectorId,
      connectorName: placementRequest.connectorName,
      noSlotAvailable: false, // enter placement mode UI (req 36)
    });
  }, [placementRequest]);

  // ── No-slot dialog: Later ─────────────────────────────────────────────
  const onPlaceLater = useCallback((widgetId: string, connectorId: string, connectorName: string) => {
    handlePlaceLater(widgetId, connectorId, connectorName); // queued in Suggested (req 34)
    setPlacementRequest(null);
  }, []);

  // ── Toast clear ───────────────────────────────────────────────────────
  const clearToast = useCallback(() => {
    setToastMessage(null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // ── Deferred prompt check (req 16-17) ────────────────────────────────
  const checkDeferred = useCallback(() => {
    const deferred = consumeDeferredPrompt();
    if (deferred) {
      showPrompt(deferred.connectorId, deferred.connectorName);
    }
  }, [showPrompt]);

  const onMenuClose = useCallback(() => { checkDeferred(); }, [checkDeferred]);
  const onPopupClose = useCallback(() => { checkDeferred(); }, [checkDeferred]);

  return {
    toastMessage,
    prompt,
    placementRequest,
    sliceSheetConnectorId,
    onConnectSuccess,
    onPromptAdd,
    onPromptDismiss,
    onPromptAddSlice,
    onPlacementDone,
    onPlacementCancel,
    onPlaceNow,
    onPlaceLater,
    clearToast,
    onMenuClose,
    onPopupClose,
  };
}
