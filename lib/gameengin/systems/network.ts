/**
 * lib/gameengin/systems/network.ts
 *
 * NETWORK SYSTEMS
 *
 * Focused module: deterministic rollback netcode for lag-free multiplayer;
 * client-side prediction with server reconciliation.
 *
 * Re-exports from power-systems so existing imports continue to work.
 */

// ─── Classes ─────────────────────────────────────────────────────────────────

export {
  RollbackNetcode,
  ClientSidePrediction,
} from '../power-systems';

// ─── Types ───────────────────────────────────────────────────────────────────

export type {
  NetInput,
  RollbackConfig,
  PredictionState,
  ServerSnapshot,
} from '../power-systems';
