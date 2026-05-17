/**
 * lib/vm/resource-quota.ts — Per-VM Resource Quota Types and Enforcement
 *
 * Defines the ResourceQuota interface and enforceQuota() helper for
 * hard-limiting GPU buffer allocation, VRAM usage, and compute time.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResourceQuota {
  /** Maximum number of live GPU buffers. */
  maxGpuBuffers: number;
  /** Maximum size of a single GPU buffer in bytes. */
  maxBufferSize: bigint;
  /** Maximum total VRAM allocation in bytes. */
  maxVram: bigint;
  /** Maximum compute dispatch time in milliseconds. */
  maxComputeMs: number;
}

export interface ResourceUsage {
  /** Current live GPU buffer count. */
  gpuBufferCount: number;
  /** Largest single buffer size allocated (bytes). */
  maxSingleBufferSize: bigint;
  /** Total VRAM in use (bytes). */
  totalVram: bigint;
  /** Elapsed compute time for current dispatch (ms). */
  computeMs: number;
}

export interface QuotaViolation {
  field: keyof ResourceQuota;
  limit: number | bigint;
  actual: number | bigint;
  message: string;
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class QuotaExceededError extends Error {
  readonly violations: readonly QuotaViolation[];

  constructor(violations: QuotaViolation[]) {
    super(
      `VM resource quota exceeded: ${violations.map((v: Record<string, unknown>) => v.message).join('; ')}`,
    );
    this.name = 'QuotaExceededError';
    this.violations = violations;
  }
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_RESOURCE_QUOTA: ResourceQuota = {
  maxGpuBuffers:   2048,
  maxBufferSize:   256n * 1024n * 1024n,  // 256 MiB
  maxVram:         1024n * 1024n * 1024n, // 1 GiB
  maxComputeMs:    100,
};

// ─── Enforcement ──────────────────────────────────────────────────────────────

/**
 * enforceQuota(quota, usage)
 *
 * Validates current resource usage against the provided quota.
 * Throws QuotaExceededError listing all violations if any limit is exceeded.
 */
export function enforceQuota(quota: ResourceQuota, usage: ResourceUsage): void {
  const violations: QuotaViolation[] = [];

  if (usage.gpuBufferCount > quota.maxGpuBuffers) {
    violations.push({
      field:   'maxGpuBuffers',
      limit:   quota.maxGpuBuffers,
      actual:  usage.gpuBufferCount,
      message: `GPU buffer count ${usage.gpuBufferCount} exceeds limit ${quota.maxGpuBuffers}`,
    });
  }

  if (usage.maxSingleBufferSize > quota.maxBufferSize) {
    violations.push({
      field:   'maxBufferSize',
      limit:   quota.maxBufferSize,
      actual:  usage.maxSingleBufferSize,
      message: `Buffer size ${usage.maxSingleBufferSize}B exceeds limit ${quota.maxBufferSize}B`,
    });
  }

  if (usage.totalVram > quota.maxVram) {
    violations.push({
      field:   'maxVram',
      limit:   quota.maxVram,
      actual:  usage.totalVram,
      message: `VRAM ${usage.totalVram}B exceeds limit ${quota.maxVram}B`,
    });
  }

  if (usage.computeMs > quota.maxComputeMs) {
    violations.push({
      field:   'maxComputeMs',
      limit:   quota.maxComputeMs,
      actual:  usage.computeMs,
      message: `Compute time ${usage.computeMs}ms exceeds limit ${quota.maxComputeMs}ms`,
    });
  }

  if (violations.length > 0) {
    throw new QuotaExceededError(violations);
  }
}

/**
 * withinQuota(quota, usage)
 *
 * Non-throwing variant. Returns true if all limits are satisfied.
 */
export function withinQuota(quota: ResourceQuota, usage: ResourceUsage): boolean {
  try {
    enforceQuota(quota, usage);
    return true;
  } catch {
    return false;
  }
}