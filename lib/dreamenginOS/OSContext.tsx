'use client';
/**
 * OSContext — DREAMenginOS React Context
 *
 * Provides a single, app-wide OS instance (bus, ledger, upgradeEngine)
 * to all components via React Context.
 *
 * Usage:
 *   // In app/layout.tsx (or any root layout):
 *   <OSProvider>{children}</OSProvider>
 *
 *   // In any component:
 *   const os = useOS();
 *   os.ledger.entries …
 *   os.bus.publish('some:event', payload);
 */

import React, { createContext, useContext, useMemo } from 'react';
import { createLedger } from '../ledger';
import { createEventBus } from '../eventBus';
import { upgradeEngine } from './index';
import type { Ledger } from '../ledger';
import type { EventBus } from '../eventBus';

// ─── OS Instance shape ────────────────────────────────────────────────────────

export interface OSInstance {
  /** Shared asset + metadata ledger. */
  ledger: Ledger;
  /** Global event bus for cross-surface messaging. */
  bus: EventBus;
  /**
   * upgradeEngine — promotes any engine descriptor with OS capabilities.
   * Re-exported here for convenience so callers don't need a second import.
   */
  upgradeEngine: typeof upgradeEngine;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const OSContext = createContext<OSInstance | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * OSProvider
 *
 * Mount once at the application root (e.g. app/layout.tsx).
 * Creates stable ledger + bus instances for the lifetime of the app.
 */
export function OSProvider({ children }: { children: React.ReactNode }) {
  const os = useMemo<OSInstance>(
    () => ({
      ledger:        createLedger(),
      bus:           createEventBus(),
      upgradeEngine,
    }),
    []
  );

  return <OSContext.Provider value={os}>{children}</OSContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useOS()
 *
 * Returns the DREAMenginOS singleton for the current application.
 * Must be called inside a component wrapped by <OSProvider>.
 */
export function useOS(): OSInstance {
  const ctx = useContext(OSContext);
  if (!ctx) {
    throw new Error(
      '[DREAMenginOS] useOS() called outside of <OSProvider>. ' +
      'Wrap your root layout with <OSProvider>.'
    );
  }
  return ctx;
}
