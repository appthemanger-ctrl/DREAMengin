// lib/engine-v2/instrumentation.ts
// Phase 1 — Instrumentation: per-system timers, heat score, ring-buffer event log, perf HUD.
// All types are pure (no React, no side-effects at module level).

// ---------------------------------------------------------------------------
// Ring buffer event log
// ---------------------------------------------------------------------------

export type EngineEventLevel = 'info' | 'warn' | 'error' | 'budget_breach';

export interface EngineEvent {
  /** Simulation tick at which the event was emitted. */
  tick: number;
  level: EngineEventLevel;
  system: string;
  message: string;
}

export const EVENT_LOG_CAPACITY = 256;

export class EngineEventLog {
  private readonly buf: EngineEvent[] = new Array(EVENT_LOG_CAPACITY);
  private head = 0;
  private count = 0;

  push(evt: EngineEvent): void {
    this.buf[this.head] = evt;
    this.head = (this.head + 1) % EVENT_LOG_CAPACITY;
    if (this.count < EVENT_LOG_CAPACITY) this.count++;
  }

  /** Return up to `n` most recent events (oldest first, newest last). */
  recent(n = EVENT_LOG_CAPACITY): EngineEvent[] {
    const len = Math.min(n, this.count);
    const result: EngineEvent[] = [];
    for (let i = 0; i < len; i++) {
      const idx = (this.head - len + i + EVENT_LOG_CAPACITY) % EVENT_LOG_CAPACITY;
      result.push(this.buf[idx]);
    }
    return result;
  }

  clear(): void {
    this.head = 0;
    this.count = 0;
  }

  get size(): number {
    return this.count;
  }
}

// ---------------------------------------------------------------------------
// Per-system timers
// ---------------------------------------------------------------------------

export interface SystemTimers {
  physicsMs: number;
  inputMs: number;
  renderMs: number;
  /** Heuristic GC pressure estimate (0–1). */
  gcPressure: number;
}

export function zeroTimers(): SystemTimers {
  return { physicsMs: 0, inputMs: 0, renderMs: 0, gcPressure: 0 };
}

/** Lightweight stopwatch — call start(), call stop() to get elapsed ms. */
export class Stopwatch {
  private t0 = 0;

  start(): void {
    this.t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  /** Returns elapsed milliseconds and resets. */
  stop(): number {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return now - this.t0;
  }
}

// ---------------------------------------------------------------------------
// Heat score
// ---------------------------------------------------------------------------

/**
 * Rolling heat score: composite of CPU time, draw calls, and memory churn.
 * Range 0 (cold) to 1 (hot). Values > 0.8 trigger degradation.
 */
export interface HeatScoreInput {
  physicsMs: number;
  renderMs: number;
  drawCalls: number;
  /** JS heap size in bytes (from performance.memory if available). */
  heapBytes: number;
  /** Previous heap bytes to estimate churn. */
  prevHeapBytes: number;
  /** Frame budget in ms (e.g., 16.67 for 60 fps). */
  frameBudgetMs: number;
  /** Max expected draw calls. */
  maxDrawCalls: number;
  /** Max expected heap bytes. */
  maxHeapBytes: number;
}

export function computeHeatScore(input: HeatScoreInput): number {
  const {
    physicsMs, renderMs, drawCalls, heapBytes, prevHeapBytes,
    frameBudgetMs, maxDrawCalls, maxHeapBytes,
  } = input;

  const cpuRatio = Math.min(1, (physicsMs + renderMs) / frameBudgetMs);
  const drawRatio = Math.min(1, drawCalls / Math.max(1, maxDrawCalls));
  const heapRatio = Math.min(1, heapBytes / Math.max(1, maxHeapBytes));
  const churnRatio = Math.min(1, Math.abs(heapBytes - prevHeapBytes) / Math.max(1, maxHeapBytes));

  // Weighted composite: CPU matters most on mobile.
  return cpuRatio * 0.5 + drawRatio * 0.2 + heapRatio * 0.2 + churnRatio * 0.1;
}

// ---------------------------------------------------------------------------
// Substep counter
// ---------------------------------------------------------------------------

/** Tracks how many physics fixed steps fired per rendered frame. */
export class SubstepCounter {
  private stepsThisFrame = 0;

  increment(): void {
    this.stepsThisFrame++;
  }

  /** Call at end of render frame to get count and reset. */
  readAndReset(): number {
    const n = this.stepsThisFrame;
    this.stepsThisFrame = 0;
    return n;
  }
}

// ---------------------------------------------------------------------------
// Entity component counters
// ---------------------------------------------------------------------------

export type ComponentTypeName = string;

export class EntityCounters {
  private readonly counts = new Map<ComponentTypeName, number>();

  set(type: ComponentTypeName, count: number): void {
    this.counts.set(type, count);
  }

  increment(type: ComponentTypeName): void {
    this.counts.set(type, (this.counts.get(type) ?? 0) + 1);
  }

  decrement(type: ComponentTypeName): void {
    const v = this.counts.get(type) ?? 0;
    this.counts.set(type, Math.max(0, v - 1));
  }

  snapshot(): Record<ComponentTypeName, number> {
    return Object.fromEntries(this.counts.entries());
  }

  clear(): void {
    this.counts.clear();
  }
}

// ---------------------------------------------------------------------------
// Budget budgets checker
// ---------------------------------------------------------------------------

export interface PerformanceBudgets {
  physicsMs: number;
  renderMs: number;
  maxContacts: number;
  maxSolverIterations: number;
  maxEntities: number;
}

export const DEFAULT_BUDGETS: PerformanceBudgets = {
  physicsMs: 4,
  renderMs: 8,
  maxContacts: 500,
  maxSolverIterations: 10,
  maxEntities: 1000,
};

export interface BudgetBreachEvent {
  system: string;
  metric: string;
  value: number;
  budget: number;
}

export function checkBudgets(
  timers: SystemTimers,
  contactCount: number,
  solverIterations: number,
  entityCount: number,
  budgets: PerformanceBudgets = DEFAULT_BUDGETS,
): BudgetBreachEvent[] {
  const breaches: BudgetBreachEvent[] = [];

  if (timers.physicsMs > budgets.physicsMs) {
    breaches.push({ system: 'physics', metric: 'physicsMs', value: timers.physicsMs, budget: budgets.physicsMs });
  }
  if (timers.renderMs > budgets.renderMs) {
    breaches.push({ system: 'render', metric: 'renderMs', value: timers.renderMs, budget: budgets.renderMs });
  }
  if (contactCount > budgets.maxContacts) {
    breaches.push({ system: 'broadphase', metric: 'contactCount', value: contactCount, budget: budgets.maxContacts });
  }
  if (solverIterations > budgets.maxSolverIterations) {
    breaches.push({ system: 'solver', metric: 'solverIterations', value: solverIterations, budget: budgets.maxSolverIterations });
  }
  if (entityCount > budgets.maxEntities) {
    breaches.push({ system: 'world', metric: 'entityCount', value: entityCount, budget: budgets.maxEntities });
  }

  return breaches;
}

// ---------------------------------------------------------------------------
// Main instrumentation snapshot (used by perf HUD)
// ---------------------------------------------------------------------------

export interface InstrumentationSnapshot {
  tick: number;
  timers: SystemTimers;
  heatScore: number;
  substepsPerFrame: number;
  contactCount: number;
  solverIterationCount: number;
  entityCounts: Record<string, number>;
  budgetBreaches: BudgetBreachEvent[];
  recentEvents: EngineEvent[];
}

export interface DebugFlags {
  showPerfHUD: boolean;
  logBudgetBreaches: boolean;
  singleStepMode: boolean;
}

export const DEFAULT_DEBUG_FLAGS: DebugFlags = {
  showPerfHUD: false,
  logBudgetBreaches: true,
  singleStepMode: false,
};
