/**
 * lib/vm/security.ts — VM Security Primitives
 *
 * checkBounds(ptr, len, max)  — hard memory-bounds check
 * SYSCALL_ALLOWLIST            — safe syscall set
 * isSyscallAllowed()           — allowlist gate
 * GPUTimeSlicer                — per-VM GPU time budget allocator
 */

// ─── Memory Bounds Checking ───────────────────────────────────────────────────

export class MemoryBoundsError extends Error {
  constructor(ptr: number, len: number, max: number) {
    super(
      `Memory bounds violation: ptr=${ptr} len=${len} end=${ptr + len} max=${max}`,
    );
    this.name = 'MemoryBoundsError';
  }
}

/**
 * checkBounds(ptr, len, max)
 *
 * Verifies that the half-open byte range [ptr, ptr+len) lies entirely
 * within [0, max).  Throws MemoryBoundsError on any violation.
 */
export function checkBounds(ptr: number, len: number, max: number): void {
  if (
    ptr < 0       ||
    len < 0       ||
    ptr + len > max ||
    ptr + len < ptr  // integer overflow guard
  ) {
    throw new MemoryBoundsError(ptr, len, max);
  }
}

// ─── Syscall Allow-List ───────────────────────────────────────────────────────

export const SYSCALL_ALLOWLIST = [
  'vm_buffer_create',
  'vm_buffer_destroy',
  'vm_buffer_write',
  'vm_buffer_read',
  'vm_buffer_map',
  'vm_buffer_unmap',
  'vm_compute_pipeline_create',
  'vm_compute_pipeline_destroy',
  'vm_bind_group_create',
  'vm_bind_group_destroy',
  'vm_command_begin',
  'vm_command_set_pipeline',
  'vm_command_set_bind_group',
  'vm_command_dispatch',
  'vm_command_dispatch_indirect',
  'vm_submit',
  'vm_wait_fence',
  'vm_get_time',
  'vm_yield',
  'vm_get_instruction_count',
] as const;

export type AllowedSyscall = (typeof SYSCALL_ALLOWLIST)[number];

/**
 * isSyscallAllowed(syscall, allowList)
 *
 * Returns true when syscall is present in allowList.
 * Pass null for allowList to permit all syscalls (dev mode only).
 */
export function isSyscallAllowed(
  syscall: string,
  allowList: readonly string[] | null = SYSCALL_ALLOWLIST,
): boolean {
  if (allowList === null) return true;
  return (allowList as string[]).includes(syscall);
}

// ─── GPU Time Slicer ─────────────────────────────────────────────────────────

export interface TimeBudget {
  vmId:       string;
  budgetMs:   number;
  startedAt:  number;
  active:     boolean;
}

/**
 * GPUTimeSlicer
 *
 * Tracks per-VM GPU time budgets within a fixed frame window (default 16 ms).
 * Each VM receives at most requestedMs, capped by whatever remains of the
 * frame budget after prior allocations.
 */
export class GPUTimeSlicer {
  private readonly frameBudgetMs: number;
  private readonly budgets = new Map<string, TimeBudget>();

  constructor(frameBudgetMs = 16) {
    this.frameBudgetMs = frameBudgetMs;
  }

  /**
   * allocate(vmId, requestedMs)
   *
   * Grant a time slice to vmId.  The actual budget is
   * min(requestedMs, availableFrameTime).
   */
  allocate(vmId: string, requestedMs: number): TimeBudget {
    const usedMs = Array.from(this.budgets.values())
      .filter((b) => b.active)
      .reduce((sum, b) => sum + b.budgetMs, 0);

    const available = Math.max(0, this.frameBudgetMs - usedMs);
    const budget: TimeBudget = {
      vmId,
      budgetMs:  Math.min(requestedMs, available),
      startedAt: Date.now(),
      active:    true,
    };
    this.budgets.set(vmId, budget);
    return budget;
  }

  /** Release the time slice for vmId (makes its ms available again). */
  release(vmId: string): void {
    const budget = this.budgets.get(vmId);
    if (budget) budget.active = false;
  }

  /**
   * isOverBudget(vmId)
   *
   * Returns true if vmId has been active longer than its allocated budget.
   */
  isOverBudget(vmId: string): boolean {
    const budget = this.budgets.get(vmId);
    if (!budget || !budget.active) return false;
    return Date.now() - budget.startedAt > budget.budgetMs;
  }

  /** Clear all allocations (call at the start of each frame). */
  reset(): void {
    this.budgets.clear();
  }
}
