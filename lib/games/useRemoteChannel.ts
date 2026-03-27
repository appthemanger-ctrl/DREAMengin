'use client';

/**
 * useRemoteChannel — BroadcastChannel bridge for cross-tab game remote control.
 *
 * Architecture justification: ARCHITECTURE.md §1 (Daydream pair system).
 * Games run on one screen/tab (Side A) while the GameRemote lives on another
 * screen/tab (Side B or a separate window). This hook bridges the two via the
 * BroadcastChannel API, which works across same-origin tabs without a server.
 *
 * Usage:
 *   - Call `useRemoteChannel('listen')` in the tab that runs the game.
 *     Incoming messages are re-dispatched as local `de-game-input` CustomEvents.
 *   - Call `broadcastGameInput(action, active)` from GameRemote's `fireAction`
 *     to send inputs to all listening tabs.
 */

import { useEffect } from 'react';

const CHANNEL_NAME = 'de-game-remote';

/**
 * Broadcast a game input action to all same-origin tabs/windows.
 * Called alongside the existing local `fireAction` in GameRemote.
 */
export function broadcastGameInput(action: string, active: boolean) {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.postMessage({ action, active });
    ch.close();
  } catch {
    // BroadcastChannel not supported — silent fallback
  }
}

/**
 * Listen for cross-tab game remote inputs and re-dispatch them as local
 * `de-game-input` CustomEvents so all game components receive them unchanged.
 */
export function useRemoteChannel() {
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    let ch: BroadcastChannel;
    try {
      ch = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return;
    }

    const handler = (e: MessageEvent) => {
      const { action, active } = e.data ?? {};
      if (typeof action === 'string' && typeof active === 'boolean') {
        window.dispatchEvent(
          new CustomEvent('de-game-input', { detail: { action, active } }),
        );
      }
    };

    ch.addEventListener('message', handler);
    return () => {
      ch.removeEventListener('message', handler);
      ch.close();
    };
  }, []);
}
