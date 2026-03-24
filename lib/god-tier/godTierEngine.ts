/**
 * DREAM_ENGINE_GOD_TIER_SYSTEM
 *
 * Built to maximize:
 * - perceived speed
 * - scene richness
 * - visual hierarchy
 * - motion quality
 * - input feel
 * - route transition dominance
 * - aggressive speculative loading
 */

export type QualityMode = 'GOD_TIER';
export type SceneMode = 'DOMINANT';
export type IntentClass =
  | 'tap_primary'
  | 'open_detail'
  | 'continue_scroll'
  | 'advance_flow'
  | 'navigate_route'
  | 'unknown';

export type DeviceSignals = {
  dpr: number;
  width: number;
  height: number;
  refreshRate?: number;
  prefersReducedMotion?: boolean;
};

export type RuntimeMetrics = {
  frameMs: number;
  avgFrameMs: number;
  cpuMs: number;
  gpuMs: number;
  droppedFrameRatio: number;
  inputLatencyMs: number;
  scrollVelocity: number;
  pointerVelocity: number;
  interactionBurst: number;
};

export type UXSignals = {
  repeatTapCount: number;
  rageTapCount: number;
  hesitationMs: number;
  backtrackCount: number;
  correctionCount: number;
  deadTapCount: number;
};

export type RouteSignals = {
  route: string;
  activeTask: string;
  primaryIntent: string;
  nextLikelyRoutes: string[];
  previousRoute?: string;
};

export type MeshSnapshot = {
  id: string;
  visible: boolean;
  interactive: boolean;
  nearPointer: boolean;
  distanceToCamera: number;
  transformDelta: number;
  materialChanged: boolean;
  screenCoverage: number;   // 0..1
  semanticWeight: number;   // 0..1
  motionWeight: number;     // 0..1
  detailWeight: number;     // 0..1
  heroWeight: number;       // 0..1
  occluded: boolean;
};

export type UIElementSnapshot = {
  id: string;
  isPrimary: boolean;
  isSecondary: boolean;
  blocksProgress: boolean;
  visible: boolean;
  inViewport: boolean;
  interactionWeight: number; // 0..1
  semanticWeight: number;    // 0..1
};

export type PrefetchRequest = {
  key: string;
  priority: number;
  reason: string;
  query: string;
  enabled: boolean;
};

export type MotionPlan = {
  microMs: number;
  structuralMs: number;
  heroMs: number;
  routeMs: number;
  ambientMs: number;
  travelScale: number;
  overshoot: number;
  stiffness: number;
  damping: number;
  allowAmbient: boolean;
  allowParallax: boolean;
  allowDepthMotion: boolean;
  allowRouteTakeover: boolean;
};

export type VisualPlan = {
  primaryScale: number;
  primaryContrast: number;
  secondaryContrast: number;
  tertiaryContrast: number;
  spacingScale: number;
  blurStrength: number;
  shadowStrength: number;
  glassStrength: number;
  saturationBoost: number;
  edgeDefinition: number;
};

export type RenderPlan = {
  targetFps: 60;
  renderEveryFrame: true;
  internalResolutionScale: number;
  lodBias: number;
  anisotropy: 8 | 16;
  shadowResolution: 2048 | 4096;
  allowBloom: boolean;
  allowSSAO: boolean;
  allowSSR: boolean;
  allowDoF: boolean;
  allowVolumetrics: boolean;
  allowChromaticAberration: boolean;
  allowFilmGrain: boolean;
  allowContactShadows: boolean;
  maxDynamicLights: number;
  maxActiveAnimations: number;
  maxHeroAnimations: number;
  sceneMode: SceneMode;
};

export type MeshDecision = {
  id: string;
  importance: number;
  freeze: boolean;
  updateHz: number;
  forceHighQualityMaterial: boolean;
  forceHeroShadows: boolean;
};

export type UIHierarchyDecision = {
  id: string;
  prominence: number;
  scale: number;
  contrast: number;
  priorityRank: number;
};

export type PredictedIntent = {
  type: IntentClass;
  confidence: number;
  routeTarget?: string;
  preloadDepth: number;
  optimisticFeedback: boolean;
};

export type GodTierState = {
  mode: QualityMode;
  renderPlan: RenderPlan;
  motionPlan: MotionPlan;
  visualPlan: VisualPlan;
  predictedIntent: PredictedIntent;
  prefetchPlan: PrefetchRequest[];
  meshDecisions: MeshDecision[];
  uiHierarchy: UIHierarchyDecision[];
  frictionOverrides: string[];
  globalIntensity: number;
};

// ─── Ring average ─────────────────────────────────────────────────────────────

export class RingAverage {
  private values: number[];
  private index = 0;
  private filled = false;

  constructor(private readonly size: number) {
    this.values = new Array(size).fill(0);
  }

  push(v: number) {
    this.values[this.index] = v;
    this.index = (this.index + 1) % this.size;
    if (this.index === 0) this.filled = true;
  }

  avg() {
    const count = this.filled ? this.size : this.index;
    if (count === 0) return 0;
    let sum = 0;
    for (let i = 0; i < count; i++) sum += this.values[i];
    return sum / count;
  }
}

/* =========================================================
   1) MAX ASSUMPTION BOOT
   Start above normal. Downgrade late.
   ========================================================= */
export function maxAssumptionBoot(device: DeviceSignals) {
  const veryHighDensity = device.dpr >= 3;
  const largeCanvas = Math.max(device.width, device.height) >= 900;
  const highRefresh = (device.refreshRate ?? 60) >= 90;

  let intensity = 1.0;
  if (veryHighDensity) intensity += 0.04;
  if (largeCanvas) intensity += 0.03;
  if (highRefresh) intensity += 0.04;

  return {
    mode: 'GOD_TIER' as const,
    baseResolutionScale: Math.min(1.25, intensity),
    baseLodBias: 1.2,
    globalIntensity: Math.min(1.15, intensity),
  };
}

/* =========================================================
   2) FRAME PRESSURE SHIELD
   Protects the premium feel without flattening the system.
   ========================================================= */
export function framePressureShield(runtime: RuntimeMetrics) {
  const mild   = runtime.avgFrameMs > 15.8 || runtime.droppedFrameRatio > 0.05;
  const medium = runtime.avgFrameMs > 18   || runtime.droppedFrameRatio > 0.09;
  const severe = runtime.avgFrameMs > 21   || runtime.droppedFrameRatio > 0.15;

  return {
    pressureLevel: severe ? 3 : medium ? 2 : mild ? 1 : 0,
    preserveInput: true,
    preserveHeroObjects: true,
    preservePrimaryTransitions: true,
    preserveBloom: !severe,
    preserveSSAO: !severe,
  };
}

/* =========================================================
   3) FIDELITY SCALER
   Drops slower than normal systems. Climbs fast when stable.
   ========================================================= */
export function fidelityScaler(runtime: RuntimeMetrics, baseScale: number): number {
  let scale = baseScale;

  if (runtime.avgFrameMs > 24)       scale -= 0.16;
  else if (runtime.avgFrameMs > 20)  scale -= 0.1;
  else if (runtime.avgFrameMs > 17)  scale -= 0.05;
  else if (runtime.avgFrameMs < 13.5 && runtime.droppedFrameRatio < 0.025) scale += 0.04;

  return Math.max(0.88, Math.min(1.3, Number(scale.toFixed(2))));
}

/* =========================================================
   4) HERO OBJECT IMPORTANCE SOLVER
   Scores what deserves resources.
   ========================================================= */
export function heroObjectImportance(mesh: MeshSnapshot, route: RouteSignals): number {
  let score = 0;

  if (mesh.visible)       score += 24;
  if (mesh.interactive)   score += 18;
  if (mesh.nearPointer)   score += 10;
  if (!mesh.occluded)     score += 8;

  score += mesh.semanticWeight * 14;
  score += mesh.motionWeight   * 10;
  score += mesh.detailWeight   * 10;
  score += mesh.heroWeight     * 16;

  if (mesh.screenCoverage > 0.2)   score += 8;
  if (mesh.screenCoverage > 0.35)  score += 6;
  if (mesh.distanceToCamera < 2.5) score += 7;
  if (route.activeTask.includes('showcase')) score += mesh.heroWeight     * 8;
  if (route.activeTask.includes('detail'))   score += mesh.semanticWeight * 5;

  if (!mesh.visible)              score -= 35;
  if (mesh.occluded)              score -= 10;
  if (mesh.distanceToCamera > 12) score -= 6;

  return Math.max(0, Math.min(100, score));
}

/* =========================================================
   5) ELITE MESH POLICY
   Freeze almost nothing unless it is truly dead.
   ========================================================= */
export function eliteMeshPolicy(
  mesh: MeshSnapshot,
  importance: number,
  pressureLevel: number,
): MeshDecision {
  const freeze =
    !mesh.visible &&
    !mesh.interactive &&
    !mesh.nearPointer &&
    mesh.transformDelta < 0.00005 &&
    !mesh.materialChanged &&
    importance < 10;

  let updateHz = 60;
  if (freeze)                                      updateHz = 1;
  else if (importance < 16) updateHz = pressureLevel >= 2 ? 20 : 30;
  else if (importance < 28) updateHz = pressureLevel >= 2 ? 30 : 45;
  else                                             updateHz = 60;

  return {
    id: mesh.id,
    importance,
    freeze,
    updateHz,
    forceHighQualityMaterial: importance >= 34,
    forceHeroShadows: importance >= 48,
  };
}

/* =========================================================
   6) CINEMATIC MOTION STACK
   Strong motion language. Route transitions dominate.
   ========================================================= */
export function cinematicMotionStack(runtime: RuntimeMetrics, reducedMotion = false): MotionPlan {
  if (reducedMotion) {
    return {
      microMs: 90,
      structuralMs: 150,
      heroMs: 180,
      routeMs: 220,
      ambientMs: 0,
      travelScale: 0.5,
      overshoot: 0.02,
      stiffness: 320,
      damping: 34,
      allowAmbient: false,
      allowParallax: false,
      allowDepthMotion: false,
      allowRouteTakeover: false,
    };
  }

  const stressed = runtime.avgFrameMs > 19 || runtime.inputLatencyMs > 70;

  return {
    microMs:        stressed ? 80  : 95,
    structuralMs:   stressed ? 145 : 185,
    heroMs:         stressed ? 210 : 280,
    routeMs:        stressed ? 260 : 360,
    ambientMs:      stressed ? 650 : 1100,
    travelScale:    stressed ? 0.82 : 1.18,
    overshoot:      stressed ? 0.05 : 0.08,
    stiffness:      stressed ? 340  : 380,
    damping:        stressed ? 30   : 28,
    allowAmbient:      true,
    allowParallax:     true,
    allowDepthMotion:  true,
    allowRouteTakeover: true,
  };
}

/* =========================================================
   7) VISUAL DOMINANCE ENGINE
   Strong hierarchy. Strong edges. Strong primary CTA ownership.
   ========================================================= */
export function visualDominanceEngine(route: RouteSignals, ux: UXSignals): VisualPlan {
  const friction =
    ux.repeatTapCount +
    ux.rageTapCount * 2 +
    ux.backtrackCount +
    ux.correctionCount +
    (ux.deadTapCount > 0 ? 2 : 0) +
    (ux.hesitationMs > 1200 ? 1 : 0);

  const struggling    = friction >= 2;
  const showcase      = route.activeTask.includes('showcase') || route.activeTask.includes('hero');
  const transactional = route.activeTask.includes('checkout') || route.activeTask.includes('purchase');

  return {
    primaryScale:      transactional ? 1.22 : 1.18,
    primaryContrast:   struggling ? 1.28 : 1.18,
    secondaryContrast: struggling ? 0.78 : 0.88,
    tertiaryContrast:  struggling ? 0.58 : 0.7,
    spacingScale:      struggling ? 1.1  : 1.03,
    blurStrength:      showcase ? 0.08 : 0.06,
    shadowStrength:    showcase ? 1.0  : 0.82,
    glassStrength:     showcase ? 0.92 : 0.6,
    saturationBoost:   transactional ? 1.0 : 1.05,
    edgeDefinition:    struggling ? 1.22 : 1.08,
  };
}

/* =========================================================
   8) INTENT PREDICTION CORE
   Aggressive speculation.
   ========================================================= */
export function predictIntent(
  route: RouteSignals,
  runtime: RuntimeMetrics,
  ux: UXSignals,
): PredictedIntent {
  let type: IntentClass = 'unknown';
  let confidence = 0.68;
  let routeTarget: string | undefined = undefined;
  let preloadDepth = 2;

  if (route.nextLikelyRoutes.length > 0) {
    type = 'navigate_route';
    routeTarget = route.nextLikelyRoutes[0];
    confidence = 0.83;
    preloadDepth = 3;
  }

  if (runtime.scrollVelocity > 0.42) {
    type = 'continue_scroll';
    confidence = Math.max(confidence, 0.78);
    preloadDepth = 2;
  }

  if (route.primaryIntent.includes('open') || route.primaryIntent.includes('detail')) {
    type = 'open_detail';
    confidence = Math.max(confidence, 0.8);
  }

  if (route.primaryIntent.includes('continue') || route.primaryIntent.includes('advance')) {
    type = 'advance_flow';
    confidence = Math.max(confidence, 0.8);
  }

  if (ux.rageTapCount > 0 || ux.deadTapCount > 0) {
    confidence -= 0.14;
    preloadDepth = Math.max(1, preloadDepth - 1);
  }

  return {
    type,
    confidence: Math.max(0, Math.min(1, confidence)),
    routeTarget,
    preloadDepth,
    optimisticFeedback: confidence > 0.66,
  };
}

/* =========================================================
   9) SPECULATIVE PREFETCH ENGINE
   ========================================================= */
export function speculativePrefetchEngine(
  route: RouteSignals,
  intent: PredictedIntent,
): PrefetchRequest[] {
  const plan: PrefetchRequest[] = [];

  plan.push({
    key: `critical:${route.route}`,
    priority: 100,
    reason: 'current visible state',
    query: `fetch critical visible data for ${route.route}`,
    enabled: true,
  });

  plan.push({
    key: `shape:${route.route}`,
    priority: 92,
    reason: 'layout stability',
    query: `fetch shape-driving data for ${route.route}`,
    enabled: true,
  });

  plan.push({
    key: `enhancement:${route.route}`,
    priority: 82,
    reason: 'visual richness',
    query: `fetch premium enrichment data for ${route.route}`,
    enabled: true,
  });

  if (route.nextLikelyRoutes[0]) {
    plan.push({
      key: `next:${route.nextLikelyRoutes[0]}`,
      priority: 88,
      reason: 'first predicted route',
      query: `prefetch shell and first payload for ${route.nextLikelyRoutes[0]}`,
      enabled: true,
    });
  }

  if (route.nextLikelyRoutes[1] && intent.preloadDepth >= 2) {
    plan.push({
      key: `next2:${route.nextLikelyRoutes[1]}`,
      priority: 70,
      reason: 'second predicted route',
      query: `prefetch lite payload for ${route.nextLikelyRoutes[1]}`,
      enabled: true,
    });
  }

  if (intent.routeTarget && intent.preloadDepth >= 3) {
    plan.push({
      key: `hero-assets:${intent.routeTarget}`,
      priority: 62,
      reason: 'speculative premium assets',
      query: `prefetch hero media and interaction assets for ${intent.routeTarget}`,
      enabled: true,
    });
  }

  return plan.sort((a, b) => b.priority - a.priority);
}

/* =========================================================
   10) FRICTION OVERRIDE
   When the user struggles, clarity gets stronger, not weaker.
   ========================================================= */
export function frictionOverride(ux: UXSignals, route: RouteSignals): string[] {
  const out: string[] = [];

  if (ux.deadTapCount > 0 || ux.repeatTapCount > 0 || ux.rageTapCount > 0) {
    out.push('enlarge_primary_hit_targets');
    out.push('instant_press_feedback');
    out.push('reduce_competing_actions');
    out.push('promote_primary_action');
  }

  if (ux.hesitationMs > 1000) {
    out.push('trim_secondary_copy');
    out.push('raise_primary_contrast');
    out.push('reveal_next_step');
  }

  if (ux.backtrackCount > 0) {
    out.push('persist_previous_selection');
    out.push('surface_recent_choice');
  }

  if (ux.correctionCount > 1) {
    out.push('early_inline_validation');
    out.push('simplify_field_constraints');
  }

  if (route.activeTask.includes('checkout')) {
    out.push('pin_cta');
    out.push('pin_total');
    out.push('suppress_nonessential_panels');
  }

  return [...new Set(out)];
}

/* =========================================================
   11) UI PRIORITY SOLVER
   Gives the UI an actual dominance order.
   ========================================================= */
export function uiPrioritySolver(
  elements: UIElementSnapshot[],
  ux: UXSignals,
): UIHierarchyDecision[] {
  const struggling =
    ux.repeatTapCount > 0 ||
    ux.rageTapCount   > 0 ||
    ux.deadTapCount   > 0 ||
    ux.hesitationMs   > 1200;

  const scored = elements.map((el) => {
    let prominence = 0;

    if (el.visible)        prominence += 14;
    if (el.inViewport)     prominence += 12;
    if (el.isPrimary)      prominence += 24;
    if (el.blocksProgress) prominence += 18;
    if (el.isSecondary)    prominence += 4;

    prominence += el.interactionWeight * 16;
    prominence += el.semanticWeight    * 12;

    if (struggling && el.isPrimary)   prominence += 10;
    if (struggling && el.isSecondary) prominence -= 4;

    const scale =
      prominence >= 50 ? 1.16 :
      prominence >= 36 ? 1.08 :
      1.0;

    const contrast =
      prominence >= 50 ? 1.22 :
      prominence >= 36 ? 1.08 :
      0.9;

    return { id: el.id, prominence, scale, contrast, priorityRank: 0 };
  });

  scored.sort((a, b) => b.prominence - a.prominence);
  return scored.map((item, index) => ({ ...item, priorityRank: index + 1 }));
}

/* =========================================================
   12) GOD-TIER ORCHESTRATOR
   ========================================================= */
export class DreamEngineGodTierSystem {
  private resolutionScale = 1.2;
  private frameHistory = new RingAverage(24);

  update(params: {
    device: DeviceSignals;
    runtime: RuntimeMetrics;
    ux: UXSignals;
    route: RouteSignals;
    meshes: MeshSnapshot[];
    ui: UIElementSnapshot[];
  }): GodTierState {
    const { device, runtime, ux, route, meshes, ui } = params;

    this.frameHistory.push(runtime.frameMs);

    const boot     = maxAssumptionBoot(device);
    const pressure = framePressureShield(runtime);

    this.resolutionScale = fidelityScaler(runtime, boot.baseResolutionScale);

    const meshDecisions = meshes.map((mesh) => {
      const importance = heroObjectImportance(mesh, route);
      return eliteMeshPolicy(mesh, importance, pressure.pressureLevel);
    });

    const motionPlan        = cinematicMotionStack(runtime, !!device.prefersReducedMotion);
    const visualPlan        = visualDominanceEngine(route, ux);
    const predictedIntent   = predictIntent(route, runtime, ux);
    const prefetchPlan      = speculativePrefetchEngine(route, predictedIntent);
    const frictionOverrides = frictionOverride(ux, route);
    const uiHierarchy       = uiPrioritySolver(ui, ux);

    const renderPlan: RenderPlan = {
      targetFps: 60,
      renderEveryFrame: true,
      internalResolutionScale: this.resolutionScale,
      lodBias:
        pressure.pressureLevel >= 3 ? 0.95 :
        pressure.pressureLevel === 2 ? 1.05 :
        1.22,
      anisotropy: pressure.pressureLevel >= 3 ? 8 : 16,
      shadowResolution: pressure.pressureLevel >= 2 ? 2048 : 4096,
      allowBloom: true,
      allowSSAO: pressure.preserveSSAO,
      allowSSR: pressure.pressureLevel < 3,
      allowDoF: pressure.pressureLevel < 2,
      allowVolumetrics: pressure.pressureLevel < 2,
      allowChromaticAberration: pressure.pressureLevel < 2,
      allowFilmGrain: false,
      allowContactShadows: pressure.pressureLevel < 3,
      maxDynamicLights:
        pressure.pressureLevel >= 3 ? 3 :
        pressure.pressureLevel === 2 ? 4 :
        6,
      maxActiveAnimations:
        pressure.pressureLevel >= 3 ? 14 :
        pressure.pressureLevel === 2 ? 20 :
        32,
      maxHeroAnimations:
        pressure.pressureLevel >= 3 ? 4 :
        pressure.pressureLevel === 2 ? 6 :
        10,
      sceneMode: 'DOMINANT',
    };

    return {
      mode: 'GOD_TIER',
      renderPlan,
      motionPlan,
      visualPlan,
      predictedIntent,
      prefetchPlan,
      meshDecisions,
      uiHierarchy,
      frictionOverrides,
      globalIntensity: boot.globalIntensity,
    };
  }
}

/* =========================================================
   BABYLON APPLICATION LAYER
   ========================================================= */

export type BabylonEngineLike = {
  setHardwareScalingLevel: (level: number) => void;
};

export type BabylonMeshLike = {
  id: string;
  isWorldMatrixFrozen: boolean;
  isVisible: boolean;
  alwaysSelectAsActiveMesh?: boolean;
  receiveShadows?: boolean;
  freezeWorldMatrix: () => void;
  unfreezeWorldMatrix: () => void;
};

export type BabylonSceneLike = {
  meshes: BabylonMeshLike[];
  imageProcessingConfiguration?: {
    contrast?: number;
    exposure?: number;
    toneMappingEnabled?: boolean;
    vignetteEnabled?: boolean;
  };
};

export function applyGodTierToBabylon(
  engine: BabylonEngineLike,
  scene: BabylonSceneLike,
  state: GodTierState,
  dpr = 1,
) {
  const hardwareScalingLevel = Math.min(
    1,
    Math.max(0.72, dpr / state.renderPlan.internalResolutionScale),
  );
  engine.setHardwareScalingLevel(hardwareScalingLevel);

  const decisionMap = new Map(state.meshDecisions.map((d) => [d.id, d]));

  for (const mesh of scene.meshes) {
    const decision = decisionMap.get(mesh.id);
    if (!decision) continue;

    if (decision.freeze) {
      if (!mesh.isWorldMatrixFrozen) mesh.freezeWorldMatrix();
    } else {
      if (mesh.isWorldMatrixFrozen) mesh.unfreezeWorldMatrix();
      if (decision.importance >= 42) mesh.alwaysSelectAsActiveMesh = true;
      if (decision.forceHeroShadows) mesh.receiveShadows = true;
    }
  }

  if (scene.imageProcessingConfiguration) {
    scene.imageProcessingConfiguration.contrast           = 1.1;
    scene.imageProcessingConfiguration.exposure           = 1.0;
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.vignetteEnabled    = false;
  }
}

/* =========================================================
   UI TOKEN OUTPUT
   ========================================================= */
export function getGodTierUiTokens(state: GodTierState) {
  return {
    classes: [
      'god-tier-ui',
      'scene-dominant',
      'render-every-frame',
      state.motionPlan.allowParallax      ? 'parallax-on'        : 'parallax-off',
      state.motionPlan.allowDepthMotion   ? 'depth-motion-on'    : 'depth-motion-off',
      state.motionPlan.allowRouteTakeover ? 'route-takeover-on'  : 'route-takeover-off',
    ].join(' '),
    vars: {
      '--gt-primary-scale':      String(state.visualPlan.primaryScale),
      '--gt-primary-contrast':   String(state.visualPlan.primaryContrast),
      '--gt-secondary-contrast': String(state.visualPlan.secondaryContrast),
      '--gt-tertiary-contrast':  String(state.visualPlan.tertiaryContrast),
      '--gt-spacing-scale':      String(state.visualPlan.spacingScale),
      '--gt-blur-strength':      String(state.visualPlan.blurStrength),
      '--gt-shadow-strength':    String(state.visualPlan.shadowStrength),
      '--gt-glass-strength':     String(state.visualPlan.glassStrength),
      '--gt-saturation-boost':   String(state.visualPlan.saturationBoost),
      '--gt-edge-definition':    String(state.visualPlan.edgeDefinition),
      '--gt-motion-micro':       `${state.motionPlan.microMs}ms`,
      '--gt-motion-structural':  `${state.motionPlan.structuralMs}ms`,
      '--gt-motion-hero':        `${state.motionPlan.heroMs}ms`,
      '--gt-motion-route':       `${state.motionPlan.routeMs}ms`,
      '--gt-motion-ambient':     `${state.motionPlan.ambientMs}ms`,
      '--gt-global-intensity':   String(state.globalIntensity),
    },
  };
}

/* =========================================================
   SINGLETON + CONVENIENCE EXPORT
   ========================================================= */
export const godTierSystem = new DreamEngineGodTierSystem();

export function runDreamEngineGodTier(input: {
  device: DeviceSignals;
  runtime: RuntimeMetrics;
  ux: UXSignals;
  route: RouteSignals;
  meshes: MeshSnapshot[];
  ui: UIElementSnapshot[];
}): GodTierState {
  return godTierSystem.update(input);
}

/** Default device signals — safe to call in SSR (falls back gracefully). */
export function defaultDeviceSignals(): DeviceSignals {
  if (typeof window === 'undefined') {
    return { dpr: 1, width: 390, height: 844, refreshRate: 60, prefersReducedMotion: false };
  }
  return {
    dpr: window.devicePixelRatio ?? 1,
    width: window.innerWidth,
    height: window.innerHeight,
    refreshRate:
      (screen as unknown as Record<string, unknown>)['refreshRate'] as number | undefined ?? 60,
    prefersReducedMotion:
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  };
}

export function defaultRuntimeMetrics(): RuntimeMetrics {
  return {
    frameMs: 16.6,
    avgFrameMs: 16.6,
    cpuMs: 5,
    gpuMs: 8,
    droppedFrameRatio: 0,
    inputLatencyMs: 20,
    scrollVelocity: 0,
    pointerVelocity: 0,
    interactionBurst: 0,
  };
}

export function defaultUXSignals(): UXSignals {
  return {
    repeatTapCount: 0,
    rageTapCount: 0,
    hesitationMs: 0,
    backtrackCount: 0,
    correctionCount: 0,
    deadTapCount: 0,
  };
}

export function defaultRouteSignals(route = '/'): RouteSignals {
  return {
    route,
    activeTask: 'browse',
    primaryIntent: 'explore',
    nextLikelyRoutes: [],
  };
}

/* =========================================================
   WEBGPU DIRECTOR BRIDGE
   Re-export the pass-based WebGPU Director so any module
   that imports from godTierEngine can also reach the
   DREAM_ENGINE_WEBGPU_DIRECTOR without a second import path.
   ========================================================= */
export {
  WebGPUDirector,
  webGPUDirector,
  buildPassPlan,
  classifyPressure,
  scoreObject,
  classifyObject,
  decideObject,
  resolveFrameBudget,
  resolveTemporalState,
  resolveResolutionScale,
  applyDirectorFrame,
  defaultDirectorMetrics,
  defaultCameraSignals,
  type CameraState,
  type Pressure,
  type QualityClass,
  type PassName,
  type PassConfig,
  type PassPlan,
  type ObjectDecision,
  type FrameBudget,
  type TemporalState,
  type DirectorFrame,
  type CameraSignals,
  type SceneObject,
  type DirectorBabylonEngine,
  type DirectorBabylonScene,
  type DirectorBabylonMesh,
} from '../webgpu/director';
