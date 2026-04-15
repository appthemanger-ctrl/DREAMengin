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
      // Transitions are fast camera moves — SSAO would ghost and is wasteful.
      // Utility cameras skip SSAO entirely (low-fi view).
      enabled: (isHero || isDetail) && p1 && !isTransition && !isUtility,
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
 *
 * Distance falloff uses a squared (quadratic) curve so that close-range objects
 * are heavily favoured over far ones — this mirrors human visual perception and
 * produces tighter resource budgets than a linear ramp.
 */
export function scoreObject(obj: SceneObject, camera: CameraSignals): number {
  if (!obj.visible || obj.occluded) return 0;

  let score = 0;

  // Visibility primitives
  score += obj.screenCoverage * 30;

  // Squared distance falloff — perceptually accurate (near objects matter much
  // more than linearly, far objects diminish quickly past a visibility horizon).
  const distNorm = 1 - Math.min(obj.distance / 20, 1);
  score += distNorm * distNorm * 20;

  // Semantic signals
  score += obj.heroWeight        * 20;
  score += obj.semanticWeight    * 12;
  score += obj.motionWeight      * 8;
  score += obj.interactionWeight * 6;

  // Camera affinity bonus
  if (camera.focusTargetId === obj.id)                    score += 18;
  if (camera.state === "hero"   && obj.heroWeight    > 0.7) score += 10;
  if (camera.state === "detail" && obj.semanticWeight > 0.5) score += 6;

  // Cost penalty — expensive objects need to earn their resources.
  // The penalty is capped relative to the object's base importance so that
  // high-value objects (hero-weighted) are not unfairly penalised.
  const totalCost =
    obj.materialCost + obj.shadowCost + obj.geometryCost + obj.textureCost;
  const basePre = score;
  score -= totalCost * 4;
  // Prevent cost penalty from taking more than 30 % of base importance
  score = Math.max(score, basePre * 0.7);

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

function snapUpdateHz(
  importance:   number,
  pressure:     Pressure,
  motionWeight: number,
): 15 | 30 | 60 {
  // Objects in significant motion must not drop below 30 Hz — doing so causes
  // visible positional stuttering that breaks temporal stability.
  const minHz: 15 | 30 = motionWeight >= 0.5 ? 30 : 15;

  if (pressure === 3)  return importance >= 72 ? 30 : minHz;
  if (pressure === 2)  return importance >= 60 ? 60 : importance >= 30 ? 30 : minHz;
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
    updateHz:              freeze ? 15 : snapUpdateHz(importance, pressure, obj.motionWeight),
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
 *
 * When `metrics` are provided, the actual GPU time is compared against the
 * pressure-tier budget.  If the GPU is already over budget (or within 10 % of
 * it), the scale is tightened immediately — this closes the feedback loop
 * faster than waiting for the pressure classifier to ratchet up.
 */
export function resolveResolutionScale(
  pressure:  Pressure,
  camera:    CameraSignals,
  metrics?:  RuntimeMetrics,
): number {
  if (camera.state === "utility") return 0.75;

  const base =
    pressure === 3 ? 0.75 :
    pressure === 2 ? 0.85 :
    pressure === 1 ? 0.93 :
    1.0;

  // Transitions tolerate slightly lower resolution
  let scale = camera.state === "transition"
    ? Math.max(0.67, base - 0.05)
    : base;

  // Budget-derived micro-adjustment: if the GPU is running hot relative to the
  // per-pressure target, knock 5 % off the scale for immediate relief.
  if (metrics) {
    const targetMs = pressure === 3 ? 20 : pressure === 2 ? 18 : 16.6;
    const gpuBudget = targetMs * 0.60;
    if (metrics.gpuMs > gpuBudget * 0.90) {
      scale = Math.max(0.67, scale - 0.05);
    }
  }

  return scale;
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
  /**
   * Wall-clock timestamp (ms) of the last pressure downgrade.
   * Upgrade decisions are held until at least HYSTERESIS_MS have elapsed
   * after a downgrade — time-based hysteresis is smoother than frame-counting
   * because it remains stable across variable frame-rate scenarios.
   */
  private _lastPressureDowngradeMs: number = -Infinity;
  /** Minimum ms of sustained improvement before a quality upgrade fires. */
  private readonly HYSTERESIS_MS = 200;

  update(input: {
    metrics: RuntimeMetrics;
    camera:  CameraSignals;
    objects: SceneObject[];
  }): DirectorFrame {
    const { metrics, camera, objects } = input;

    // Pressure — downgrade immediately, upgrade after HYSTERESIS_MS of
    // sustained improvement.  Time-based hysteresis avoids the frame-count
    // drift that occurs at variable frame rates.
    const rawPressure = classifyPressure(metrics);
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let pressure: Pressure;

    if (rawPressure > this._lastPressure) {
      // Downgrade is instant — record the timestamp so the upgrade gate knows
      // when consistent improvement began.
      pressure                       = rawPressure;
      this._lastPressureDowngradeMs  = nowMs;
    } else if (rawPressure < this._lastPressure) {
      // Upgrade waits HYSTERESIS_MS of sustained low pressure before firing.
      // Do NOT update _lastPressureDowngradeMs here — that timestamp marks the
      // last downgrade and must remain stable so subsequent upgrade checks keep
      // counting from the same reference point.
      if (nowMs - this._lastPressureDowngradeMs >= this.HYSTERESIS_MS) {
        pressure = rawPressure;
      } else {
        pressure = this._lastPressure;
      }
    } else {
      pressure = rawPressure;
    }
    this._lastPressure = pressure;

    const passPlan        = buildPassPlan(pressure, camera);
    const objectDecisions = objects.map((o) => decideObject(o, camera, pressure));
    const frameBudget     = resolveFrameBudget(metrics, pressure);
    const temporal        = resolveTemporalState(camera, pressure);
    const resolutionScale = resolveResolutionScale(pressure, camera, metrics);

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
  // Resolution — cap at 1.0 so we never render below the canvas buffer resolution.
  // Values > 1 cause Babylon to render at a fraction of the canvas size then
  // upscale, producing visible blur.  Values ≤ 1 are fine: 1 = native canvas
  // resolution; < 1 = super-sampling (sharper, costs more GPU).
  const hwScale = Math.min(1.0, devicePixelRatio / frame.resolutionScale);
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

// ─── 11) Scene-object builder helpers ────────────────────────────────────────

/**
 * Per-mesh metadata hints that callers can supply to `babylonMeshToSceneObject`.
 *
 * All fields are optional.  If omitted, sensible conservative defaults are used
 * so static/background meshes are treated as low-importance objects.
 */
export type MeshHints = {
  /** Fraction of the viewport the mesh occupies.  0..1. Default 0.05. */
  screenCoverage?:    number;
  /** Camera distance in world units.  Default 10. */
  distance?:          number;
  /** Is this the hero / protagonist mesh?  0..1. Default 0. */
  heroWeight?:        number;
  /** Semantic importance (labels, key props).  0..1. Default 0.3. */
  semanticWeight?:    number;
  /** How much this mesh moves this frame.  0..1. Default 0. */
  motionWeight?:      number;
  /** Interaction affordance (button, pickable).  0..1. Default 0. */
  interactionWeight?: number;
  /** Does the mesh use a heavy PBR/custom material?  0..1. Default 0.3. */
  materialCost?:      number;
  /** Does the mesh cast expensive shadows?  0..1. Default 0.2. */
  shadowCost?:        number;
  /** High poly / subdivision surface?  0..1. Default 0.2. */
  geometryCost?:      number;
  /** High-res or many textures?  0..1. Default 0.2. */
  textureCost?:       number;
};

/**
 * Convert a `DirectorBabylonMesh` (the thin structural type already known to
 * the Director) into a full `SceneObject` ready for `director.update()`.
 *
 * Call this inside a render loop to build the objects array without manually
 * spelling out every field per-scene.
 *
 * ```ts
 * const objects = scene.meshes.map((m) =>
 *   babylonMeshToSceneObject(m, {
 *     heroWeight: m.id === 'player' ? 1 : 0,
 *     motionWeight: m.id === 'player' ? 1 : 0,
 *   })
 * );
 * const frame = director.update({ metrics, camera, objects });
 * ```
 */
export function babylonMeshToSceneObject(
  mesh:         DirectorBabylonMesh,
  hints:        MeshHints = {},
  lastVisible?: boolean,
): SceneObject {
  return {
    id:               mesh.id,
    visible:          mesh.isVisible,
    occluded:         false,
    transparent:      false,
    skinned:          false,
    screenCoverage:   hints.screenCoverage    ?? 0.05,
    distance:         hints.distance          ?? 10,
    heroWeight:       hints.heroWeight        ?? 0,
    semanticWeight:   hints.semanticWeight    ?? 0.3,
    motionWeight:     hints.motionWeight      ?? 0,
    interactionWeight: hints.interactionWeight ?? 0,
    materialCost:     hints.materialCost      ?? 0.3,
    shadowCost:       hints.shadowCost        ?? 0.2,
    geometryCost:     hints.geometryCost      ?? 0.2,
    textureCost:      hints.textureCost       ?? 0.2,
    lastFrameVisible: lastVisible             ?? mesh.isVisible,
  };
}

/**
 * Build a `SceneObject[]` from an entire Babylon scene mesh list using a
 * per-mesh hints resolver callback.
 *
 * ```ts
 * const objects = buildSceneObjects(scene.meshes, (mesh) => ({
 *   heroWeight: mesh.id === 'hero' ? 1 : 0,
 *   motionWeight: activeMeshIds.has(mesh.id) ? 0.8 : 0,
 * }));
 * ```
 */
export function buildSceneObjects(
  meshes:        DirectorBabylonMesh[],
  hintsResolver: (mesh: DirectorBabylonMesh) => MeshHints = () => ({}),
  lastVisibleSet?: Set<string>,
): SceneObject[] {
  return meshes.map((m) =>
    babylonMeshToSceneObject(
      m,
      hintsResolver(m),
      lastVisibleSet ? lastVisibleSet.has(m.id) : m.isVisible,
    )
  );
}
