/**
 * lib/enginpipe/orchestration/index.ts
 *
 * Component 6 — Workflow Orchestration Pattern
 *
 * A lightweight, pure-TypeScript workflow orchestrator that:
 *
 *   1. Accepts scheduled or trigger-fired workflow definitions
 *   2. Analyses telemetry signals (provided externally) to decide if a
 *      workflow should fire
 *   3. Dispatches the workflow through the cross-Engin bridge
 *   4. Tracks execution history with pass/fail accounting
 *
 * Architecture: The orchestrator itself is side-effect free.  All I/O
 * (Supabase, fetch, timers) happens in adapters provided by the caller.
 * This keeps the module testable in pure Node without mocking anything.
 *
 * Spec: docs/enginpipe/README.md §6
 */

// ─── Engin identity ──────────────────────────────────────────────────────────

export type OrchEnginId =
  | 'music'
  | 'games'
  | 'lab'
  | 'code'
  | 'brand'
  | 'create';

// ─── Telemetry signal ─────────────────────────────────────────────────────────

export interface TelemetrySignal {
  /** Which Engin produced this signal. */
  enginId: OrchEnginId;
  /** The event type that fired (matches TelemetryEventType). */
  eventType: string;
  /** How many times this event has fired in the analysis window. */
  count: number;
  /** Latest epoch ms for the event. */
  lastSeenAt: number;
  /** Optional key-value context from the event payload. */
  context?: Record<string, unknown>;
}

// ─── Workflow trigger ─────────────────────────────────────────────────────────

export type TriggerKind =
  | 'schedule'   // fires on a cron-like interval
  | 'telemetry'  // fires when a telemetry threshold is met
  | 'manual';    // fires on explicit `.dispatch()` call

export interface ScheduleTrigger {
  kind: 'schedule';
  /** Interval in milliseconds. */
  intervalMs: number;
}

export interface TelemetryTrigger {
  kind: 'telemetry';
  /** Which Engin to watch. */
  enginId: OrchEnginId;
  /** Which event type to watch. */
  eventType: string;
  /** Minimum event count in the analysis window to fire. */
  threshold: number;
}

export interface ManualTrigger {
  kind: 'manual';
}

export type WorkflowTrigger = ScheduleTrigger | TelemetryTrigger | ManualTrigger;

// ─── Orchestration workflow ───────────────────────────────────────────────────

export type OrchWorkflowStage =
  | 'analyze'
  | 'dispatch'
  | 'validate'
  | 'log';

export interface OrchWorkflowDef {
  /** Globally unique slug for this workflow. */
  readonly id: string;
  /** Human-readable name. */
  readonly name: string;
  /** What triggers execution. */
  readonly trigger: WorkflowTrigger;
  /**
   * The sequence of stages this workflow runs through.
   * Defaults to `['analyze', 'dispatch', 'validate', 'log']`.
   */
  readonly stages?: readonly OrchWorkflowStage[];
  /**
   * The action to perform.  Returns a payload that downstream systems
   * receive via the bridge.  May be async.
   *
   * @param signals  Telemetry signals at the time of execution.
   * @returns        Arbitrary payload, or `null` to abort dispatch.
   */
  execute(signals: TelemetrySignal[]): Promise<Record<string, unknown> | null>;
}

// ─── Execution record ─────────────────────────────────────────────────────────

export type OrchRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'aborted';

export interface OrchRunRecord {
  readonly workflowId: string;
  readonly runId: string;
  readonly startedAt: number;
  endedAt?: number;
  status: OrchRunStatus;
  payload?: Record<string, unknown>;
  error?: string;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface Orchestrator {
  /**
   * Register a workflow definition.  Idempotent by `def.id`.
   */
  register(def: OrchWorkflowDef): void;

  /**
   * Unregister a workflow by ID.
   */
  unregister(id: string): void;

  /**
   * Manually dispatch a workflow by ID, bypassing its trigger.
   * Returns the run record for the execution.
   */
  dispatch(
    workflowId: string,
    signals?: TelemetrySignal[],
  ): Promise<OrchRunRecord>;

  /**
   * Evaluate all registered workflows against `signals`.
   * Any `telemetry` or `manual` trigger that should fire will be dispatched.
   *
   * Call periodically (e.g. every 60 s) from your server-side scheduler.
   */
  tick(signals: TelemetrySignal[]): Promise<OrchRunRecord[]>;

  /**
   * Return a read-only view of execution history (most-recent first).
   * Capped at `maxHistory` entries (default 500).
   */
  getHistory(limit?: number): readonly OrchRunRecord[];

  /**
   * Return the run records for a specific workflow.
   */
  getWorkflowHistory(workflowId: string, limit?: number): readonly OrchRunRecord[];

  /**
   * Returns all registered workflow definitions.
   */
  getWorkflows(): readonly OrchWorkflowDef[];
}

// ─── createOrchestrator factory ───────────────────────────────────────────────

let _runCounter = 0;
function newRunId(workflowId: string): string {
  return `run-${workflowId}-${Date.now().toString(36)}-${(_runCounter++).toString(36)}`;
}

export interface OrchestratorOptions {
  /**
   * Maximum execution history entries to retain.
   * Older entries are dropped once the cap is reached.
   * @default 500
   */
  maxHistory?: number;

  /**
   * Called after every successful dispatch so the host can forward
   * payloads to the DualRuntime bridge or an external queue.
   */
  onDispatch?: (record: OrchRunRecord) => void;
}

/**
 * Create a new Orchestrator instance.
 *
 * All internal state is local to the instance — safe to create multiple
 * instances (e.g., one per Engin) without interference.
 */
export function createOrchestrator(opts: OrchestratorOptions = {}): Orchestrator {
  const maxHistory = opts.maxHistory ?? 500;
  const defs       = new Map<string, OrchWorkflowDef>();
  const history: OrchRunRecord[] = [];
  const lastFiredAt = new Map<string, number>();

  function push(record: OrchRunRecord): void {
    history.unshift(record);
    if (history.length > maxHistory) history.length = maxHistory;
  }

  async function run(
    def: OrchWorkflowDef,
    signals: TelemetrySignal[],
  ): Promise<OrchRunRecord> {
    const record: OrchRunRecord = {
      workflowId: def.id,
      runId:      newRunId(def.id),
      startedAt:  Date.now(),
      status:     'running',
    };
    push(record);

    try {
      const payload = await def.execute(signals);
      if (payload === null) {
        record.status  = 'aborted';
        record.endedAt = Date.now();
        return record;
      }

      record.payload = payload;
      record.status  = 'success';
      record.endedAt = Date.now();
      lastFiredAt.set(def.id, Date.now());
      opts.onDispatch?.(record);
    } catch (err) {
      record.status  = 'failed';
      record.endedAt = Date.now();
      record.error   = err instanceof Error ? err.message : String(err);
    }

    return record;
  }

  function shouldFire(def: OrchWorkflowDef, signals: TelemetrySignal[]): boolean {
    const { trigger } = def;

    if (trigger.kind === 'manual') return false;

    if (trigger.kind === 'schedule') {
      const last = lastFiredAt.get(def.id) ?? 0;
      return Date.now() - last >= trigger.intervalMs;
    }

    if (trigger.kind === 'telemetry') {
      return signals.some(
        (s) =>
          s.enginId   === trigger.enginId &&
          s.eventType === trigger.eventType &&
          s.count     >= trigger.threshold,
      );
    }

    return false;
  }

  return {
    register(def) {
      defs.set(def.id, def);
    },

    unregister(id) {
      defs.delete(id);
    },

    async dispatch(workflowId, signals = []) {
      const def = defs.get(workflowId);
      if (!def) {
        const record: OrchRunRecord = {
          workflowId,
          runId:     newRunId(workflowId),
          startedAt: Date.now(),
          endedAt:   Date.now(),
          status:    'failed',
          error:     `Unknown workflow: ${workflowId}`,
        };
        push(record);
        return record;
      }
      return run(def, signals);
    },

    async tick(signals) {
      const fired: OrchRunRecord[] = [];
      for (const def of defs.values()) {
        if (shouldFire(def, signals)) {
          const record = await run(def, signals);
          fired.push(record);
        }
      }
      return fired;
    },

    getHistory(limit = maxHistory) {
      return history.slice(0, limit);
    },

    getWorkflowHistory(workflowId, limit = 50) {
      return history
        .filter((r) => r.workflowId === workflowId)
        .slice(0, limit);
    },

    getWorkflows() {
      return [...defs.values()];
    },
  };
}
