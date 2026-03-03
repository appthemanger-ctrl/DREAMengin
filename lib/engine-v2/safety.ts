// lib/engine-v2/safety.ts
// Phase 9 — Engine safety: NaN guards, panic mode, safe fallbacks,
// GC guardrails, scene-loader timeout, mobile sanity preset.
// Pure module — no React, no DOM dependencies.

import type { PerformanceBudgets } from './instrumentation';

// ---------------------------------------------------------------------------
// NaN / bounds guards
// ---------------------------------------------------------------------------

export function assertFinite(v: number, label: string): void {
  if (!isFinite(v)) {
    throw new EngineInvariantError(`NaN/Infinity detected: ${label} = ${v}`);
  }
}

export function assertBounded(v: number, min: number, max: number, label: string): void {
  if (v < min || v > max) {
    throw new EngineInvariantError(`Out-of-bounds: ${label} = ${v} (expected ${min}..${max})`);
  }
}

export class EngineInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EngineInvariantError';
  }
}

/** Non-throwing variant — returns true if value is a finite, bounded number. */
export function isFiniteBounded(v: number, min: number, max: number): boolean {
  return isFinite(v) && v >= min && v <= max;
}

// ---------------------------------------------------------------------------
// NaN scan for body arrays
// ---------------------------------------------------------------------------

export interface BodyLike {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface NaNScanResult {
  hasNaN: boolean;
  affectedIds: number[];
}

export function scanForNaN(bodies: BodyLike[]): NaNScanResult {
  const affectedIds: number[] = [];
  for (const body of bodies) {
    if (!isFinite(body.x) || !isFinite(body.y) ||
        !isFinite(body.vx) || !isFinite(body.vy)) {
      affectedIds.push(body.id);
    }
  }
  return { hasNaN: affectedIds.length > 0, affectedIds };
}

// ---------------------------------------------------------------------------
// Panic mode
// ---------------------------------------------------------------------------

export type PanicReason = 'nan_detected' | 'budget_exceeded' | 'asset_timeout' | 'external';

export interface PanicState {
  active: boolean;
  reason: PanicReason | null;
  message: string;
  /** Wall-clock timestamp when panic was triggered. */
  triggeredAt: number;
}

export function newPanicState(): PanicState {
  return { active: false, reason: null, message: '', triggeredAt: 0 };
}

export function triggerPanic(
  state: PanicState,
  reason: PanicReason,
  message: string,
  nowMs: number,
): PanicState {
  return { active: true, reason, message, triggeredAt: nowMs };
}

export function recoverFromPanic(state: PanicState): PanicState {
  return newPanicState();
}

// ---------------------------------------------------------------------------
// Safe fallback assets
// ---------------------------------------------------------------------------

export interface FallbackAssets {
  meshId: string;
  textureId: string;
}

export const DEFAULT_FALLBACKS: FallbackAssets = {
  meshId: 'placeholder-mesh',
  textureId: 'placeholder-texture',
};

export function resolveMeshId(
  requestedId: string | undefined,
  availableIds: Set<string>,
  fallbacks: FallbackAssets = DEFAULT_FALLBACKS,
): string {
  if (requestedId && availableIds.has(requestedId)) return requestedId;
  return fallbacks.meshId;
}

export function resolveTextureId(
  requestedId: string | undefined,
  availableIds: Set<string>,
  fallbacks: FallbackAssets = DEFAULT_FALLBACKS,
): string {
  if (requestedId && availableIds.has(requestedId)) return requestedId;
  return fallbacks.textureId;
}

// ---------------------------------------------------------------------------
// Scene loader timeout
// ---------------------------------------------------------------------------

export const SCENE_LOAD_TIMEOUT_MS = 10_000;

export class SceneLoaderTimeout {
  private startedAt: number | null = null;
  private readonly timeoutMs: number;

  constructor(timeoutMs = SCENE_LOAD_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }

  start(nowMs: number): void {
    this.startedAt = nowMs;
  }

  /** Returns true if the timeout has been exceeded. */
  isExpired(nowMs: number): boolean {
    if (this.startedAt === null) return false;
    return nowMs - this.startedAt >= this.timeoutMs;
  }

  reset(): void {
    this.startedAt = null;
  }

  elapsedMs(nowMs: number): number {
    if (this.startedAt === null) return 0;
    return nowMs - this.startedAt;
  }
}

// ---------------------------------------------------------------------------
// Mobile sanity preset
// ---------------------------------------------------------------------------

export const MOBILE_SANITY_BUDGETS: PerformanceBudgets = {
  physicsMs: 2,       // tighter on mobile
  renderMs: 4,        // tighter on mobile
  maxContacts: 200,   // fewer contacts allowed
  maxSolverIterations: 4,
  maxEntities: 200,   // fewer entities
};

// ---------------------------------------------------------------------------
// GC guardrail: allocation counter (coarse check)
// ---------------------------------------------------------------------------

/**
 * Lightweight allocation-rate estimator.
 * Uses performance.memory (Chrome-only) as a heuristic.
 * On unsupported platforms, always returns 0.
 */
export function estimateAllocationRateBytes(): number {
  if (
    typeof performance === 'undefined' ||
    !('memory' in performance)
  ) {
    return 0;
  }
  // Cast through unknown since TypeScript doesn't type performance.memory.
  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
  return mem?.usedJSHeapSize ?? 0;
}

// ---------------------------------------------------------------------------
// Degradation strategy
// ---------------------------------------------------------------------------

/**
 * Ordered degradation steps when budgets are exceeded.
 * Returns a modified budget with reduced limits.
 */
export type DegradationLevel = 0 | 1 | 2 | 3;

export function applyDegradation(
  baseBudgets: PerformanceBudgets,
  level: DegradationLevel,
): PerformanceBudgets {
  switch (level) {
    case 0: return baseBudgets;
    case 1: return { ...baseBudgets, maxSolverIterations: Math.max(1, Math.floor(baseBudgets.maxSolverIterations * 0.6)) };
    case 2: return { ...baseBudgets, maxSolverIterations: Math.max(1, Math.floor(baseBudgets.maxSolverIterations * 0.3)) };
    case 3: return {
      ...baseBudgets,
      maxSolverIterations: 1,
      maxContacts: Math.max(10, Math.floor(baseBudgets.maxContacts * 0.4)),
      maxEntities: Math.max(10, Math.floor(baseBudgets.maxEntities * 0.5)),
    };
  }
}
