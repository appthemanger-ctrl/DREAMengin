/**
 * lib/webgpu/adaptiveQuality.ts
 *
 * Phase 9 §2: Adaptive quality scaling — automatically reduces polygon count,
 * texture resolution, and physics ticks based on device battery and frame rate.
 *
 * Extends the Director system (lib/webgpu/director.ts) with battery awareness
 * and a higher-level QualityTier abstraction that the runtime consults.
 *
 * Architecture justification:
 *   - docs/ARCHITECTURE.md §10: performance-first, render-on-demand.
 *   - The Director handles per-frame GPU decisions. This module adds
 *     device-level signals (battery, thermal, memory) that change on
 *     a slower cadence (seconds, not frames).
 */

import { classifyPressure, type Pressure, type RuntimeMetrics } from './director';

// ─── Quality tiers ────────────────────────────────────────────────────────────

/**
 * High-level quality tier.
 * - ultra:  maximum fidelity, no scaling
 * - high:   slight reduction in post-processing
 * - medium: reduced resolution, simplified physics
 * - low:    aggressive savings for low-end / low-battery devices
 */
export type QualityTier = 'ultra' | 'high' | 'medium' | 'low';

export interface QualityProfile {
  tier: QualityTier;
  /** Resolution scale (0.5 = half resolution) */
  resolutionScale: number;
  /** Max polygon count multiplier (1.0 = full, 0.25 = quarter) */
  polygonBudget: number;
  /** Texture resolution multiplier */
  textureBudget: number;
  /** Physics simulation rate (Hz) */
  physicsHz: number;
  /** Max shadow map resolution */
  shadowMapSize: 512 | 1024 | 2048 | 4096;
  /** Enable post-processing (bloom, DOF, SSAO) */
  postProcessing: boolean;
  /** Enable particle effects */
  particles: boolean;
  /** Max particle count multiplier */
  particleBudget: number;
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

const PROFILES: Record<QualityTier, QualityProfile> = {
  ultra: {
    tier: 'ultra',
    resolutionScale: 1.0,
    polygonBudget: 1.0,
    textureBudget: 1.0,
    physicsHz: 60,
    shadowMapSize: 4096,
    postProcessing: true,
    particles: true,
    particleBudget: 1.0,
  },
  high: {
    tier: 'high',
    resolutionScale: 1.0,
    polygonBudget: 0.75,
    textureBudget: 0.75,
    physicsHz: 60,
    shadowMapSize: 2048,
    postProcessing: true,
    particles: true,
    particleBudget: 0.75,
  },
  medium: {
    tier: 'medium',
    resolutionScale: 0.75,
    polygonBudget: 0.5,
    textureBudget: 0.5,
    physicsHz: 30,
    shadowMapSize: 1024,
    postProcessing: true,
    particles: true,
    particleBudget: 0.5,
  },
  low: {
    tier: 'low',
    resolutionScale: 0.5,
    polygonBudget: 0.25,
    textureBudget: 0.25,
    physicsHz: 20,
    shadowMapSize: 512,
    postProcessing: false,
    particles: false,
    particleBudget: 0.0,
  },
};

export function getQualityProfile(tier: QualityTier): QualityProfile {
  return { ...PROFILES[tier] };
}

// ─── Battery API ──────────────────────────────────────────────────────────────

export interface BatteryState {
  /** Battery level 0..1 (1.0 = full, 0.0 = empty) */
  level: number;
  /** Whether the device is currently charging */
  charging: boolean;
}

/**
 * Read battery state from the Battery Status API.
 * Returns null if the API is unavailable (desktop, unsupported browser).
 */
export async function getBatteryState(): Promise<BatteryState | null> {
  if (typeof navigator === 'undefined') return null;

  try {
    // Battery Status API is available on many mobile browsers
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{
        level: number;
        charging: boolean;
      }>;
    };

    if (!nav.getBattery) return null;

    const battery = await nav.getBattery();
    return {
      level: battery.level,
      charging: battery.charging,
    };
  } catch {
    return null;
  }
}

// ─── Device memory ────────────────────────────────────────────────────────────

/**
 * Approximate device memory in GB (Device Memory API).
 * Returns null if unavailable.
 */
export function getDeviceMemoryGB(): number | null {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as Navigator & { deviceMemory?: number };
  return nav.deviceMemory ?? null;
}

/**
 * Logical CPU core count (Navigator.hardwareConcurrency).
 */
export function getCoreCount(): number {
  if (typeof navigator === 'undefined') return 4;
  return navigator.hardwareConcurrency ?? 4;
}

// ─── Tier resolver ────────────────────────────────────────────────────────────

export interface DeviceSignals {
  /** Battery state (null if API unavailable) */
  battery: BatteryState | null;
  /** Device memory in GB (null if unavailable) */
  memoryGB: number | null;
  /** CPU core count */
  cores: number;
  /** Current frame pressure from Director */
  pressure: Pressure;
}

/**
 * Resolve the appropriate quality tier given device signals.
 *
 * Decision tree:
 *   1. Battery < 15% and not charging → low
 *   2. Battery < 30% and not charging → medium
 *   3. Pressure 3 (critical) → low
 *   4. Pressure 2 → medium
 *   5. Pressure 1 → high
 *   6. Low memory (≤2 GB) → medium
 *   7. Otherwise → ultra
 */
export function resolveQualityTier(signals: DeviceSignals): QualityTier {
  const { battery, memoryGB, pressure } = signals;

  // Battery-first: aggressive power saving when battery is critical
  if (battery && !battery.charging) {
    if (battery.level < 0.15) return 'low';
    if (battery.level < 0.30) return 'medium';
  }

  // Frame pressure overrides device capabilities
  if (pressure === 3) return 'low';
  if (pressure === 2) return 'medium';
  if (pressure === 1) return 'high';

  // Memory constraint
  if (memoryGB !== null && memoryGB <= 2) return 'medium';

  return 'ultra';
}

// ─── Adaptive Quality Controller ──────────────────────────────────────────────

/**
 * Stateful controller that tracks quality tier over time with hysteresis
 * to avoid rapid tier flapping.
 *
 * Downgrades happen immediately (protect the user experience).
 * Upgrades require `upgradeFrames` consecutive frames at the higher tier
 * before the upgrade is committed.
 */
export class AdaptiveQualityController {
  private currentTier: QualityTier = 'ultra';
  private candidateTier: QualityTier | null = null;
  private candidateFrames = 0;
  private readonly upgradeFrames: number;

  constructor(opts?: { upgradeFrames?: number }) {
    this.upgradeFrames = opts?.upgradeFrames ?? 90; // ~1.5 seconds at 60fps
  }

  private static tierOrder: QualityTier[] = ['low', 'medium', 'high', 'ultra'];

  private static tierIndex(tier: QualityTier): number {
    return AdaptiveQualityController.tierOrder.indexOf(tier);
  }

  /**
   * Feed in a new set of device signals and get back the current quality profile.
   * Call once per frame (or on a slower cadence if preferred).
   */
  update(signals: DeviceSignals): QualityProfile {
    const desired = resolveQualityTier(signals);
    const desiredIdx = AdaptiveQualityController.tierIndex(desired);
    const currentIdx = AdaptiveQualityController.tierIndex(this.currentTier);

    if (desiredIdx < currentIdx) {
      // Downgrade: apply immediately
      this.currentTier = desired;
      this.candidateTier = null;
      this.candidateFrames = 0;
    } else if (desiredIdx > currentIdx) {
      // Upgrade: requires sustained evidence
      if (this.candidateTier === desired) {
        this.candidateFrames++;
        if (this.candidateFrames >= this.upgradeFrames) {
          this.currentTier = desired;
          this.candidateTier = null;
          this.candidateFrames = 0;
        }
      } else {
        this.candidateTier = desired;
        this.candidateFrames = 1;
      }
    } else {
      // Same tier — reset upgrade candidate
      this.candidateTier = null;
      this.candidateFrames = 0;
    }

    return getQualityProfile(this.currentTier);
  }

  getTier(): QualityTier { return this.currentTier; }
  getProfile(): QualityProfile { return getQualityProfile(this.currentTier); }
}

/**
 * Helper: create DeviceSignals from RuntimeMetrics + async battery read.
 */
export async function gatherDeviceSignals(
  metrics: RuntimeMetrics,
): Promise<DeviceSignals> {
  const [battery] = await Promise.all([getBatteryState()]);
  return {
    battery,
    memoryGB: getDeviceMemoryGB(),
    cores: getCoreCount(),
    pressure: classifyPressure(metrics),
  };
}
