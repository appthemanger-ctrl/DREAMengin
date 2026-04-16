'use client';

/**
 * OSContext — DREAMengin OS React Context
 *
 * Provides a single shared OS instance (event bus, ledger, upgradeEngine)
 * to the entire component tree via <OSProvider>.
 *
 * Usage:
 *   // In app/layout.tsx:
 *   <OSProvider>{children}</OSProvider>
 *
 *   // In any component:
 *   const os = useOS();
 *   os.bus.emit('my-event', { data: 42 });
 *   os.ledger.entries.size;
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createLedger, type Ledger } from '../ledger';
import { createEventBus, type EventBus } from '../eventBus';
import { upgradeEngine, type UpgradedEngine, type EngineBase } from './index';

// ─── OS Instance type ─────────────────────────────────────────────────────────

export interface DreamOS {
  /** Global in-memory ledger shared across all surfaces. */
  ledger: Ledger;
  /** Global event bus for cross-surface messaging. */
  bus: EventBus;
  /**
   * Upgrades an engine object with OS features (ledger, bridge, telemetry).
   * Re-exported here for convenience so callers don't need a separate import.
   */
  upgradeEngine: typeof upgradeEngine;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const OSContext = createContext<DreamOS | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * OSProvider
 *
 * Wrap the root layout with this provider to make the OS instance available
 * everywhere via `useOS()`.  A single bus and ledger are created once for
 * the lifetime of the page.
 */
export function OSProvider({ children }: { children: ReactNode }) {
  const os = useMemo<DreamOS>(
    () => ({
      ledger: createLedger(),
      bus:    createEventBus(),
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
 * Returns the shared DreamOS instance.  Throws if called outside an
 * OSProvider.
 */
export function useOS(): DreamOS {
  const ctx = useContext(OSContext);
  if (!ctx) {
    throw new Error('useOS() must be called inside <OSProvider>.');
  }
  return ctx;
}

// Convenience re-export so callers can import types from this file.
export type { UpgradedEngine, EngineBase };
