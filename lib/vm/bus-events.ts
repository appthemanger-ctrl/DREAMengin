/**
 * lib/vm/bus-events.ts — Dream OS Bus Event Payloads for the VM subsystem
 *
 * Four events wired into DualRuntime:
 *   vm:workload-submitted  — a workload was queued to a VM region
 *   vm:compute-complete    — a workload finished successfully
 *   vm:error               — a workload (or VM) raised an error
 *   vm:stats-update        — periodic VM telemetry snapshot
 */

// --- Payload Types ------------------------------------------------------------

export interface VMWorkloadSubmittedPayload {
  workloadId:  string;
  region:      'top' | 'bottom';
  channel:     string;
  priority:    number;
  submittedAt: number;
}

export interface VMComputeCompletePayload {
  workloadId:  string;
  region:      'top' | 'bottom';
  durationMs:  number;
  completedAt: number;
}

export interface VMErrorPayload {
  workloadId?: string;
  region:      'top' | 'bottom';
  error:       string;
  code?:       number;
  occurredAt:  number;
}

export interface VMStatsPayload {
  activeWorkloads:    number;
  completedWorkloads: number;
  errorCount:         number;
  avgComputeMs:       number;
  uptimeMs:           number;
}

export interface VMStatsUpdatePayload {
  region:    'top' | 'bottom';
  stats:     VMStatsPayload;
  updatedAt: number;
}

// --- Event Map ----------------------------------------------------------------

export interface VMBusEventMap {
  'vm:workload-submitted': VMWorkloadSubmittedPayload;
  'vm:compute-complete':   VMComputeCompletePayload;
  'vm:error':              VMErrorPayload;
  'vm:stats-update':       VMStatsUpdatePayload;
}

export type VMBusEventName = keyof VMBusEventMap;
