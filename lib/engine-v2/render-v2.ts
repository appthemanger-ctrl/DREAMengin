// lib/engine-v2/render-v2.ts
// Phase 6 — Render upgrade: GPU instancing stubs, dynamic resolution scaler,
// render-on-demand, visual presets, LOD, interaction burst mode.
// Pure logic module — rendering calls are stubs to be wired to Babylon.js.

// ---------------------------------------------------------------------------
// Visual presets
// ---------------------------------------------------------------------------

export type VisualPreset = 'Minimal' | 'Balanced' | 'Premium';

export interface VisualPresetConfig {
  renderScale: number;
  shadowsEnabled: boolean;
  postEffectsEnabled: boolean;
  maxLODDistance: number;
  instancingEnabled: boolean;
  maxDrawCallsHint: number;
}

export const VISUAL_PRESETS: Record<VisualPreset, VisualPresetConfig> = {
  Minimal: {
    renderScale: 0.5,
    shadowsEnabled: false,
    postEffectsEnabled: false,
    maxLODDistance: 200,
    instancingEnabled: true,
    maxDrawCallsHint: 50,
  },
  Balanced: {
    renderScale: 0.75,
    shadowsEnabled: false,
    postEffectsEnabled: false,
    maxLODDistance: 500,
    instancingEnabled: true,
    maxDrawCallsHint: 150,
  },
  Premium: {
    renderScale: 1.0,
    shadowsEnabled: true,
    postEffectsEnabled: false, // still disabled by default per spec
    maxLODDistance: 1000,
    instancingEnabled: true,
    maxDrawCallsHint: 300,
  },
};

// ---------------------------------------------------------------------------
// Dynamic resolution scaler
// ---------------------------------------------------------------------------

export interface RenderScalerConfig {
  /** Heat score threshold above which we start scaling down. */
  heatThresholdDown: number;
  /** Heat score threshold below which we scale back up. */
  heatThresholdUp: number;
  minScale: number;
  maxScale: number;
  /** Scale step size per adjustment. */
  step: number;
}

export const DEFAULT_SCALER_CONFIG: RenderScalerConfig = {
  heatThresholdDown: 0.8,
  heatThresholdUp: 0.5,
  minScale: 0.5,
  maxScale: 1.0,
  step: 0.05,
};

export class DynamicResolutionScaler {
  private currentScale: number;
  private readonly cfg: RenderScalerConfig;

  constructor(initialScale: number, config: RenderScalerConfig = DEFAULT_SCALER_CONFIG) {
    this.currentScale = initialScale;
    this.cfg = config;
  }

  /** Update scale based on current heat score. Returns new scale. */
  update(heatScore: number): number {
    if (heatScore > this.cfg.heatThresholdDown) {
      this.currentScale = Math.max(this.cfg.minScale, this.currentScale - this.cfg.step);
    } else if (heatScore < this.cfg.heatThresholdUp) {
      this.currentScale = Math.min(this.cfg.maxScale, this.currentScale + this.cfg.step);
    }
    return this.currentScale;
  }

  get scale(): number {
    return this.currentScale;
  }

  forceSet(scale: number): void {
    this.currentScale = Math.max(this.cfg.minScale, Math.min(this.cfg.maxScale, scale));
  }
}

// ---------------------------------------------------------------------------
// Interaction burst mode
// ---------------------------------------------------------------------------

export interface BurstModeState {
  active: boolean;
  /** Wall-clock timestamp (ms) when burst expires. */
  expiresAt: number;
  /** Target render scale during burst. */
  burstScale: number;
}

export function newBurstModeState(burstScale = 1.0): BurstModeState {
  return { active: false, expiresAt: 0, burstScale };
}

/** Call on every touch/pointer event to activate burst for `durationMs`. */
export function activateBurst(
  state: BurstModeState,
  nowMs: number,
  durationMs = 1500,
): BurstModeState {
  return { ...state, active: true, expiresAt: nowMs + durationMs };
}

/** Call each frame to check if burst has expired. Returns updated state. */
export function tickBurst(state: BurstModeState, nowMs: number): BurstModeState {
  if (state.active && nowMs >= state.expiresAt) {
    return { ...state, active: false };
  }
  return state;
}

/** Returns the effective render scale (burst overrides dynamic scaler when active). */
export function effectiveRenderScale(
  burstState: BurstModeState,
  dynamicScale: number,
): number {
  return burstState.active ? burstState.burstScale : dynamicScale;
}

// ---------------------------------------------------------------------------
// LOD rules
// ---------------------------------------------------------------------------

export type LODLevel = 'full' | 'reduced' | 'hidden';

export function computeLOD(distancePx: number, maxLODDistance: number): LODLevel {
  if (distancePx > maxLODDistance) return 'hidden';
  if (distancePx > maxLODDistance * 0.5) return 'reduced';
  return 'full';
}

// ---------------------------------------------------------------------------
// Render-on-demand (dirty tracking)
// ---------------------------------------------------------------------------

export class RenderOnDemand {
  private dirty = true;
  private dirtyReason = '';

  markDirty(reason = ''): void {
    this.dirty = true;
    this.dirtyReason = reason;
  }

  /** Returns true if a render pass should fire. Clears the dirty flag. */
  shouldRender(): boolean {
    if (this.dirty) {
      this.dirty = false;
      this.dirtyReason = '';
      return true;
    }
    return false;
  }

  get isDirty(): boolean {
    return this.dirty;
  }

  get reason(): string {
    return this.dirtyReason;
  }
}

// ---------------------------------------------------------------------------
// GPU instancing stub (wired to Babylon.js thin instances externally)
// ---------------------------------------------------------------------------

export interface InstancedMeshDescriptor {
  meshId: string;
  /** World-space transforms: flat array [x, y, scaleX, scaleY, rotation, ...] per instance. */
  transforms: Float32Array;
  count: number;
}

/** Build instanced mesh descriptor from a list of same-mesh entities. */
export function buildInstancedMesh(
  meshId: string,
  entities: ReadonlyArray<{ x: number; y: number; scaleX: number; scaleY: number; rotation: number }>,
): InstancedMeshDescriptor {
  const count = entities.length;
  const transforms = new Float32Array(count * 5);
  for (let i = 0; i < count; i++) {
    const e = entities[i];
    transforms[i * 5]     = e.x;
    transforms[i * 5 + 1] = e.y;
    transforms[i * 5 + 2] = e.scaleX;
    transforms[i * 5 + 3] = e.scaleY;
    transforms[i * 5 + 4] = e.rotation;
  }
  return { meshId, transforms, count };
}

// ---------------------------------------------------------------------------
// Static mesh freeze
// ---------------------------------------------------------------------------

export interface MeshFreezeState {
  frozen: boolean;
  /** If true, this mesh never contributes to draw calls. */
  culled: boolean;
}

export function shouldFreeze(bodySleeping: boolean, isStatic: boolean): boolean {
  return bodySleeping || isStatic;
}
