/**
 * lib/vm/dual-runtime.ts — DualRuntime Orchestrator
 *
 * Manages two independent VM regions:
 *   TOO_VM    — primary / HomeDream Surface region
 *   BOTTOM_VM — secondary / DreamSpace region
 *
 * When TOO_VM accumulates errors it becomes unhealthy and BOTTOM_VM
 * takes over as the primary dispatch target (automatic failover).
 * The primary VM can be restored via recoverVM('TOO_VM').
 *
 * Dream OS bus events emitted:
 *   vm:workload-submitted  — workload queued
 *   vm:compute-complete    — workload finished
 *   vm:error               — VM or workload error
 *   vm:stats-update        — periodic telemetry
 */

import { InterVMChannel, type VMEvent } from './inter-vm-messaging';
import type {
  VMBusEventMap,
  VMBusEventName,
  VMWorkloadSubmittedPayload,
  VMComputeCompletePayload,
  VMErrorPayload,
  VMStatsUpdatePayload,
  VMStatsPayload,
} from './bus-events';

// --- Types --------------------------------------------------------------------

export type VMId = 'TOO_VM' | 'BOTTOM_VM';

export interface VMWorkloadSpec {
  id:      string;
  channel: string;
  priority: number;
  payload: unknown;
}

export interface VMRuntimeStats {
  vmId:               VMId;
  activeWorkloads:    number;
  completedWorkloads: number;
  errorCount:         number;
  avgComputeMs:       number;
  uptimeMs:           number;
  isHealthy:          boolean;
}

type BusHandler<K extends VMBusEventName> = (payload: VMBusEventMap[K]) => void;

// --- Internal VMRuntime -------------------------------------------------------

class VMRuntime {
  readonly id:          VMId;
  isHealthy = true;

  private readonly startedAt   = Date.now();
  private completedWorkloads   = 0;
  private errorCount           = 0;
  private totalComputeMs       = 0;
  private activeWorkloads      = new Set<string>();
  private readonly ERROR_LIMIT = 5;

  constructor(id: VMId) { this.id = id; }

  get stats(): VMRuntimeStats {
    return {
      vmId:               this.id,
      activeWorkloads:    this.activeWorkloads.size,
      completedWorkloads: this.completedWorkloads,
      errorCount:         this.errorCount,
      avgComputeMs:       this.completedWorkloads > 0
        ? this.totalComputeMs / this.completedWorkloads
        : 0,
      uptimeMs:           Date.now() - this.startedAt,
      isHealthy:          this.isHealthy,
    };
  }

  beginWorkload(id: string): void {
    this.activeWorkloads.add(id);
  }

  completeWorkload(id: string, durationMs: number): void {
    this.activeWorkloads.delete(id);
    this.completedWorkloads++;
    this.totalComputeMs += durationMs;
  }

  recordError(workloadId?: string): void {
    if (workloadId) this.activeWorkloads.delete(workloadId);
    this.errorCount++;
    if (this.errorCount >= this.ERROR_LIMIT) this.isHealthy = false;
  }

  reset(): void {
    this.errorCount = 0;
    this.isHealthy  = true;
  }
}

// --- DualRuntime -------------------------------------------------------------

export class DualRuntime {
  private readonly tooVm    = new VMRuntime('TOO_VM');
  private readonly bottomVm = new VMRuntime('BOTTOM_VM');
  private readonly channel  = new InterVMChannel();
  private _primary:          VMRuntime;
  private _failoverActive  = false;

  private readonly busListeners = new Map<
    VMBusEventName,
    Set<BusHandler<VMBusEventName>>
  >();

  constructor() {
    this._primary = this.tooVm;
    this.channel.subscribe(msg: string => this._onInterVMMessage(msg));
  }

  // -- Accessors -------------------------------------------------------------

  get primaryVmId(): VMId        { return this._primary.id; }
  get isFailoverActive(): boolean { return this._failoverActive; }

  // -- Workload submission ---------------------------------------------------

  /**
   * Submit a workload to the current primary VM.
   * Fires vm:workload-submitted immediately, vm:compute-complete on next tick.
   */
  submitWorkload(spec: VMWorkloadSpec): string {
    const vm      = this._primary;
    const region: 'top' | 'bottom' = vm.id === 'TOO_VM' ? 'top' : 'bottom';
    vm.beginWorkload(spec.id);

    const submitted: VMWorkloadSubmittedPayload = {
      workloadId:  spec.id,
      region,
      channel:     spec.channel,
      priority:    spec.priority,
      submittedAt: Date.now(),
    };
    this._emit('vm:workload-submitted', submitted);
    this.channel.send({ type: 'workload-submitted', workloadId: spec.id, region, timestamp: submitted.submittedAt });

    const startMs = Date.now();
    Promise.resolve().then(() => {
      const durationMs = Date.now() - startMs;
      vm.completeWorkload(spec.id, durationMs);

      const complete: VMComputeCompletePayload = {
        workloadId: spec.id, region, durationMs, completedAt: Date.now(),
      };
      this._emit('vm:compute-complete', complete);
      this._emitStats(vm);
    });

    return spec.id;
  }

  // -- Error reporting -------------------------------------------------------

  reportError(vmId: VMId, error: string, workloadId?: string): void {
    const vm = vmId === 'TOO_VM' ? this.tooVm : this.bottomVm;
    vm.recordError(workloadId);

    const payload: VMErrorPayload = {
      workloadId,
      region:    vmId === 'TOO_VM' ? 'top' : 'bottom',
      error,
      occurredAt: Date.now(),
    };
    this._emit('vm:error', payload);

    if (vmId === 'TOO_VM' && !this.tooVm.isHealthy) {
      this._activateFailover();
    }
  }

  // -- Recovery --------------------------------------------------------------

  recoverVM(vmId: VMId): void {
    const vm = vmId === 'TOO_VM' ? this.tooVm : this.bottomVm;
    vm.reset();
    if (vmId === 'TOO_VM' && this._failoverActive) {
      this._primary      = this.tooVm;
      this._failoverActive = false;
    }
  }

  // -- Stats ------------------------------------------------------------------

  getStats(): { tooVm: VMRuntimeStats; bottomVm: VMRuntimeStats } {
    return { tooVm: this.tooVm.stats, bottomVm: this.bottomVm.stats };
  }

  // -- Event bus -------------------------------------------------------------

  on<K extends VMBusEventName>(event: K, handler: BusHandler<K>): () => void {
    const set = this.busListeners.get(event) ?? new Set<BusHandler<VMBusEventName>>();
    set.add(handler as BusHandler<VMBusEventName>);
    this.busListeners.set(event, set);
    return () => { set.delete(handler as BusHandler<VMBusEventName>); };
  }

  // -- Lifecycle -------------------------------------------------------------

  destroy(): void {
    this.channel.destroy();
    this.busListeners.clear();
  }

  // -- Internal --------------------------------------------------------------

  private _activateFailover(): void {
    if (this._failoverActive) return;
    this._failoverActive = true;
    this._primary        = this.bottomVm;
    console.warn('[DualRuntime] TOO_VM unhealthy → failing over to BOTTOM_VM');
  }

  private _emit<K extends VMBusEventName>(event: K, payload: VMBusEventMap[K]): void {
    const set = this.busListeners.get(event);
    if (!set) return;
    for (const h of set) {
      try { (h as BusHandler<K>)(payload); } catch { /* ignore */ }
    }
  }

  private _emitStats(vm: VMRuntime): void {
    const s = vm.stats;
    const stats: VMStatsPayload = {
      activeWorkloads:    s.activeWorkloads,
      completedWorkloads: s.completedWorkloads,
      errorCount:         s.errorCount,
      avgComputeMs:       s.avgComputeMs,
      uptimeMs:           s.uptimeMs,
    };
    const payload: VMStatsUpdatePayload = {
      region:    vm.id === 'TOO_VM' ? 'top' : 'bottom',
      stats,
      updatedAt: Date.now(),
    };
    this._emit('vm:stats-update', payload);
  }

  private _onInterVMMessage(msg: VMEvent): void {
    if (msg.type === 'error') {
      const vmId: VMId = msg.region === 'top' ? 'TOO_VM' : 'BOTTOM_VM';
      this.reportError(vmId, msg.error, msg.workloadId);
    }
  }
}

// --- Singleton ----------------------------------------------------------------

export const dualRuntime = new DualRuntime();
