/**
 * DREAM_ENGINE_WEBGPU_DIRECTOR
 *
 * Engine-style WebGPU quality pipeline.
 * This is the version closer to Unreal thinking:
 * - pass-based
 * - budget-driven
 * - temporally stable
 * - hero-object privileged
 * - camera-state aware
 *
 * This is architecture code, not adapter-specific boilerplate.
 *
 * Architecture justification: docs/ARCHITECTURE.md §10 — render-on-demand,
 * hardware scaling, performance-first.  The Director replaces ad-hoc quality
 * toggles spread across scenes with a single authoritative decision tree that
 * every renderer consults before touching the GPU.
 */

// ─── Core enumerations ────────────────────────────────────────────────────────

export type CameraState =
  | "hero"
  | "browse"
  | "detail"
  | "transition"
  | "utility";

/** Thermal / frame-pressure tier.  0 = no pressure; 3 = critical. */
export type Pressure = 0 | 1 | 2 | 3;

/** Per-object rendering privilege class. */
export type QualityClass =
  | "hero"
  | "primary"
  | "secondary"
  | "background"
  | "culled";

/** Every render pass the Director knows about. */
export type PassName =
  | "depth_prepass"
  | "shadow_pass"
  | "gbuffer"
  | "forward_transparency"
  | "lighting"
  | "ssao"
  | "bloom"
  | "dof"
  | "taa"
  | "tonemap"
  | "ui";

// ─── Input signal types ───────────────────────────────────────────────────────

export type RuntimeMetrics = {
  frameMs: number;
  avgFrameMs: number;
  gpuMs: number;
  cpuMs: number;
  droppedFrameRatio: number;
  uploadMs: number;
};

export type CameraSignals = {
  state: CameraState;
  velocity: number;
  cutActive: boolean;
  focusTargetId?: string;
};

export type SceneObject = {
  id: string;
  visible: boolean;
  occluded: boolean;
  transparent: boolean;
  skinned: boolean;
  screenCoverage: number;    // 0..1
  distance: number;
  heroWeight: number;        // 0..1
  semanticWeight: number;    // 0..1
  motionWeight: number;      // 0..1
  interactionWeight: number; // 0..1
  materialCost: number;      // 0..1
  shadowCost: number;        // 0..1
  geometryCost: number;      // 0..1
  textureCost: number;       // 0..1
  lastFrameVisible: boolean;
};

// ─── Output decision types ────────────────────────────────────────────────────

export type ObjectDecision = {
  id: string;
  importance: number;
  qualityClass: QualityClass;
  lodLevel: 0 | 1 | 2 | 3;
  updateHz: 15 | 30 | 60;
  castShadow: boolean;
  receiveShadow: boolean;
  highQualityMaterial: boolean;
  highQualityTransparency: boolean;
  textureMipBias: 0 | 1 | 2;
  freeze: boolean;
};

export type PassConfig = {
  enabled: boolean;
  resolutionScale: number;
};

export type PassPlan = Record<PassName, PassConfig>;

export type FrameBudget = {
  /** GPU budget in milliseconds per frame. */
  gpuBudgetMs: number;
  /** CPU budget in milliseconds per frame. */
  cpuBudgetMs: number;
  /** Upload budget in milliseconds per frame. */
  uploadBudgetMs: number;
  /** Whether we are currently inside budget. */
  withinBudget: boolean;
};

export type TemporalState = {
  /** Enable TAA accumulation. */
  taaEnabled: boolean;
  /** Number of frames to accumulate for TAA. */
  taaFrameCount: 2 | 4 | 8;
  /** Jitter pattern size in pixels. */
  jitterScale: number;
  /** Discard temporal history on camera cut. */
  historyInvalidated: boolean;
};

export type DirectorFrame = {
  pressure: Pressure;
  passPlan: PassPlan;
  objectDecisions: ObjectDecision[];
  frameBudget: FrameBudget;
  temporal: TemporalState;
  resolutionScale: number;
};

// ─── 1) Pressure classifier ───────────────────────────────────────────────────

/**
 * Classify the current GPU/CPU pressure into a 0–3 tier.
 *
 * Downgrade is eager; upgrade is conservative (hysteresis).
 */
export function classifyPressure(metrics: RuntimeMetrics): Pressure {
  const { avgFrameMs, droppedFrameRatio, gpuMs } = metrics;

  if (avgFrameMs > 24 || droppedFrameRatio > 0.18 || gpuMs > 22) return 3;
  if (avgFrameMs > 20 || droppedFrameRatio > 0.10 || gpuMs > 18) return 2;
  if (avgFrameMs > 17 || droppedFrameRatio > 0.05 || gpuMs > 14) return 1;
  return 0;
}

// ─── 2) Pass plan builder ─────────────────────────────────────────────────────

const FULL_RES  = 1.0;
const HALF_RES  = 0.5;
const QUART_RES = 0.25;

/**
 * Build a complete PassPlan driven by pressure and camera state.
 *
 * Hero camera → full quality.
 * Browse camera → reduce post-process cost.
 * Utility camera → strip to the minimum viable set.
 */
export function buildPassPlan(
  pressure: Pressure,
  camera: CameraSignals,
): PassPlan {
  const cam = camera.state;
  const isHero       = cam === "hero";
  const isDetail     = cam === "detail";
  const isTransition = cam === "transition";
  const isUtility    = cam === "utility";

  const p0 = pressure === 0;
  const p1 = pressure <= 1;
  const p2 = pressure <= 2;

  return {
    depth_prepass: {
      enabled: true,
      resolutionScale: FULL_RES,
    },
    shadow_pass: {
      enabled: !isUtility && p2,
      resolutionScale: isHero && p0 ? FULL_RES : HALF_RES,
    },
    gbuffer: {
      enabled: true,
      resolutionScale: isUtility ? HALF_RES : FULL_RES,
    },
    forward_transparency: {
      enabled: !isUtility,
      resolutionScale: isHero && p1 ? FULL_RES : HALF_RES,
    },
    lighting: {
      enabled: true,
      resolutionScale: FULL_RES,
    },
    ssao: {
      enabled: (isHero || isDetail) && p1,
      resolutionScale: HALF_RES,
    },
    bloom: {
      enabled: p2 && !isUtility,
      resolutionScale: isHero && p0 ? HALF_RES : QUART_RES,
    },
    dof: {
      enabled: isHero && p0 && !isTransition,
      resolutionScale: HALF_RES,
    },
    taa: {
      enabled: p1 && !camera.cutActive,
      resolutionScale: FULL_RES,
    },
    tonemap: {
      enabled: true,
      resolutionScale: FULL_RES,
    },
    ui: {
      enabled: true,
      resolutionScale: FULL_RES,
    },
  };
}

// ─── 3) Object importance solver ─────────────────────────────────────────────

/**
 * Score a single scene object on a 0–100 scale.
 *
 * Higher score = more resources allocated.
 */
export function scoreObject(obj: SceneObject, camera: CameraSignals): number {
  if (!obj.visible || obj.occluded) return 0;

  let score = 0;

  // Visibility primitives
  score += obj.screenCoverage * 30;
  score += (1 - Math.min(obj.distance / 20, 1)) * 20;

  // Semantic signals
  score += obj.heroWeight      * 20;
  score += obj.semanticWeight  * 12;
  score += obj.motionWeight    * 8;
  score += obj.interactionWeight * 6;

  // Camera affinity bonus
  if (camera.focusTargetId === obj.id)          score += 18;
  if (camera.state === "hero" && obj.heroWeight > 0.7) score += 10;
  if (camera.state === "detail" && obj.semanticWeight > 0.5) score += 6;

  // Cost penalty — expensive objects need to earn their resources
  const totalCost =
    obj.materialCost + obj.shadowCost + obj.geometryCost + obj.textureCost;
  score -= totalCost * 4;

  // Temporal stability bonus (was visible last frame → no stutter risk)
  if (obj.lastFrameVisible) score += 4;

  return Math.max(0, Math.min(100, score));
}

// ─── 4) Quality class classifier ─────────────────────────────────────────────

export function classifyObject(importance: number, pressure: Pressure): QualityClass {
  if (importance === 0)                           return "culled";
  if (importance >= 72)                           return "hero";
  if (importance >= 48 && pressure <= 2)          return "primary";
  if (importance >= 28 && pressure <= 3)          return "secondary";
  if (importance >= 8)                            return "background";
  return "culled";
}

// ─── 5) Per-object decision maker ────────────────────────────────────────────

function snapUpdateHz(importance: number, pressure: Pressure): 15 | 30 | 60 {
  if (pressure === 3)  return importance >= 72 ? 30 : 15;
  if (pressure === 2)  return importance >= 60 ? 60 : importance >= 30 ? 30 : 15;
  if (pressure === 1)  return importance >= 40 ? 60 : 30;
  return 60;
}

function snapLod(importance: number, pressure: Pressure): 0 | 1 | 2 | 3 {
  if (pressure === 3)  return importance >= 72 ? 1 : importance >= 40 ? 2 : 3;
  if (pressure === 2)  return importance >= 72 ? 0 : importance >= 50 ? 1 : 2;
  if (pressure === 1)  return importance >= 60 ? 0 : 1;
  return 0;
}

function snapMipBias(importance: number, pressure: Pressure): 0 | 1 | 2 {
  if (pressure >= 3 && importance < 60) return 2;
  if (pressure >= 2 && importance < 40) return 1;
  return 0;
}

/**
 * Produce a full ObjectDecision for a single scene object.
 */
export function decideObject(
  obj: SceneObject,
  camera: CameraSignals,
  pressure: Pressure,
): ObjectDecision {
  const importance  = scoreObject(obj, camera);
  const qualityClass = classifyObject(importance, pressure);
  const culled      = qualityClass === "culled";

  const freeze =
    culled ||
    (!obj.visible && !obj.lastFrameVisible && obj.motionWeight < 0.05);

  return {
    id:                    obj.id,
    importance,
    qualityClass,
    lodLevel:              snapLod(importance, pressure),
    updateHz:              freeze ? 15 : snapUpdateHz(importance, pressure),
    castShadow:            !culled && importance >= 50 && obj.shadowCost < 0.8,
    receiveShadow:         !culled && importance >= 30,
    highQualityMaterial:   importance >= 60 && pressure <= 1,
    highQualityTransparency: obj.transparent && importance >= 60 && pressure <= 1,
    textureMipBias:        snapMipBias(importance, pressure),
    freeze,
  };
}

// ─── 6) Frame budget resolver ─────────────────────────────────────────────────

/**
 * Resolve a per-frame budget and check whether the current metrics are on track.
 *
 * Target: 60 fps → 16.6 ms total.  GPU gets 60 %, CPU 25 %, upload 15 %.
 */
export function resolveFrameBudget(
  metrics: RuntimeMetrics,
  pressure: Pressure,
): FrameBudget {
  // Reduce budget at high pressure to give breathing room
  const targetMs    = pressure === 3 ? 20 : pressure === 2 ? 18 : 16.6;
  const gpuBudgetMs    = targetMs * 0.60;
  const cpuBudgetMs    = targetMs * 0.25;
  const uploadBudgetMs = targetMs * 0.15;
  const withinBudget   =
    metrics.gpuMs    <= gpuBudgetMs    &&
    metrics.cpuMs    <= cpuBudgetMs    &&
    metrics.uploadMs <= uploadBudgetMs;

  return { gpuBudgetMs, cpuBudgetMs, uploadBudgetMs, withinBudget };
}

// ─── 7) Temporal state resolver ───────────────────────────────────────────────

/**
 * Resolve TAA and jitter settings for the current frame.
 *
 * Camera cuts must invalidate temporal history to prevent ghosting.
 * High velocity reduces TAA accumulation to prevent blur.
 */
export function resolveTemporalState(
  camera: CameraSignals,
  pressure: Pressure,
): TemporalState {
  const taaEnabled = pressure <= 2 && !camera.cutActive;

  let taaFrameCount: 2 | 4 | 8 = 8;
  if (pressure >= 2)             taaFrameCount = 2;
  else if (camera.velocity > 0.4) taaFrameCount = 2;
  else if (camera.velocity > 0.1) taaFrameCount = 4;

  const jitterScale       = taaEnabled ? (camera.velocity > 0.3 ? 0.4 : 1.0) : 0;
  const historyInvalidated = camera.cutActive;

  return { taaEnabled, taaFrameCount, jitterScale, historyInvalidated };
}

// ─── 8) Resolution scale solver ──────────────────────────────────────────────

/**
 * Choose a global internal resolution scale.
 *
 * Starts at 1.0 and steps down conservatively under pressure.
 * Never goes below 0.67 to preserve readability.
 */
export function resolveResolutionScale(
  pressure: Pressure,
  camera: CameraSignals,
): number {
  if (camera.state === "utility") return 0.75;

  const base =
    pressure === 3 ? 0.75 :
    pressure === 2 ? 0.85 :
    pressure === 1 ? 0.93 :
    1.0;

  // Transitions tolerate slightly lower resolution
  if (camera.state === "transition") return Math.max(0.67, base - 0.05);
  return base;
}

// ─── 9) Director class ────────────────────────────────────────────────────────

/**
 * WebGPU Director — the single authoritative source for all rendering decisions.
 *
 * Call `update()` once per frame with the current metrics, camera signals, and
 * list of scene objects.  Consume the returned `DirectorFrame` to configure
 * the GPU pipeline, LODs, shadow pass, TAA, etc.
 *
 * ```ts
 * const director = new WebGPUDirector();
 *
 * // inside the render loop
 * const frame = director.update({ metrics, camera, objects });
 * applyDirectorFrame(engine, scene, frame);
 * ```
 */
export class WebGPUDirector {
  private _lastPressure: Pressure = 0;
  private _hysteresisFrames       = 0;
  private readonly HYSTERESIS     = 8; // frames before upgrading quality

  update(input: {
    metrics: RuntimeMetrics;
    camera:  CameraSignals;
    objects: SceneObject[];
  }): DirectorFrame {
    const { metrics, camera, objects } = input;

    // Pressure — downgrade immediately, upgrade after hysteresis
    const rawPressure = classifyPressure(metrics);
    let pressure: Pressure;

    if (rawPressure > this._lastPressure) {
      // Downgrade is instant
      pressure              = rawPressure;
      this._hysteresisFrames = 0;
    } else if (rawPressure < this._lastPressure) {
      // Upgrade waits for HYSTERESIS frames of sustained improvement
      this._hysteresisFrames++;
      if (this._hysteresisFrames >= this.HYSTERESIS) {
        pressure              = rawPressure;
        this._hysteresisFrames = 0;
      } else {
        pressure = this._lastPressure;
      }
    } else {
      pressure              = rawPressure;
      this._hysteresisFrames = 0;
    }
    this._lastPressure = pressure;

    const passPlan        = buildPassPlan(pressure, camera);
    const objectDecisions = objects.map((o) => decideObject(o, camera, pressure));
    const frameBudget     = resolveFrameBudget(metrics, pressure);
    const temporal        = resolveTemporalState(camera, pressure);
    const resolutionScale = resolveResolutionScale(pressure, camera);

    return {
      pressure,
      passPlan,
      objectDecisions,
      frameBudget,
      temporal,
      resolutionScale,
    };
  }
}

// ─── 10) Babylon.js application layer ─────────────────────────────────────────

export type DirectorBabylonEngine = {
  setHardwareScalingLevel: (level: number) => void;
};

export type DirectorBabylonMesh = {
  id: string;
  isWorldMatrixFrozen: boolean;
  isVisible: boolean;
  alwaysSelectAsActiveMesh?: boolean;
  receiveShadows?: boolean;
  freezeWorldMatrix:   () => void;
  unfreezeWorldMatrix: () => void;
};

export type DirectorBabylonScene = {
  meshes: DirectorBabylonMesh[];
  imageProcessingConfiguration?: {
    contrast?:            number;
    exposure?:            number;
    toneMappingEnabled?:  boolean;
    vignetteEnabled?:     boolean;
  };
};

/**
 * Apply a DirectorFrame to a live Babylon.js engine and scene.
 *
 * This is the bridge between the Director's abstract decisions and the
 * Babylon.js API.  Call once per frame after `director.update()`.
 */
export function applyDirectorFrame(
  engine: DirectorBabylonEngine,
  scene:  DirectorBabylonScene,
  frame:  DirectorFrame,
  devicePixelRatio = 1,
): void {
  // Resolution
  const hwScale = Math.max(0.67, devicePixelRatio / frame.resolutionScale);
  engine.setHardwareScalingLevel(hwScale);

  // Mesh decisions
  const decisionMap = new Map(frame.objectDecisions.map((d) => [d.id, d]));
  for (const mesh of scene.meshes) {
    const d = decisionMap.get(mesh.id);
    if (!d) continue;

    if (d.freeze) {
      if (!mesh.isWorldMatrixFrozen) mesh.freezeWorldMatrix();
    } else {
      if (mesh.isWorldMatrixFrozen) mesh.unfreezeWorldMatrix();
      if (d.qualityClass === "hero") mesh.alwaysSelectAsActiveMesh = true;
      if (d.receiveShadow)           mesh.receiveShadows            = true;
    }
  }

  // Image processing
  if (scene.imageProcessingConfiguration) {
    const ipc = scene.imageProcessingConfiguration;
    ipc.contrast           = 1.1;
    ipc.exposure           = 1.0;
    ipc.toneMappingEnabled = frame.passPlan.tonemap.enabled;
    ipc.vignetteEnabled    = false;
  }
}

// ─── Singleton + convenience helpers ─────────────────────────────────────────

export const webGPUDirector = new WebGPUDirector();

/** Safe default metrics for SSR or pre-warm frames. */
export function defaultDirectorMetrics(): RuntimeMetrics {
  return {
    frameMs:           16.6,
    avgFrameMs:        16.6,
    gpuMs:             8.0,
    cpuMs:             4.0,
    droppedFrameRatio: 0,
    uploadMs:          1.0,
  };
}

/** Safe default camera signals. */
export function defaultCameraSignals(state: CameraState = "browse"): CameraSignals {
  return { state, velocity: 0, cutActive: false };
}
