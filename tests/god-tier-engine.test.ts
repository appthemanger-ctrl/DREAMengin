/**
 * Tests for DreamEngineGodTierSystem and its helper functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RingAverage,
  maxAssumptionBoot,
  framePressureShield,
  fidelityScaler,
  heroObjectImportance,
  eliteMeshPolicy,
  cinematicMotionStack,
  visualDominanceEngine,
  predictIntent,
  speculativePrefetchEngine,
  frictionOverride,
  uiPrioritySolver,
  applyGodTierToBabylon,
  getGodTierUiTokens,
  DreamEngineGodTierSystem,
  defaultDeviceSignals,
  defaultRuntimeMetrics,
  defaultUXSignals,
  defaultRouteSignals,
  type MeshSnapshot,
  type UIElementSnapshot,
  type RouteSignals,
  type RuntimeMetrics,
  type UXSignals,
  type DeviceSignals,
  type GodTierState,
  type BabylonEngineLike,
  type BabylonSceneLike,
} from '@/lib/god-tier/godTierEngine';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeMesh = (overrides: Partial<MeshSnapshot> = {}): MeshSnapshot => ({
  id: 'test-mesh',
  visible: true,
  interactive: true,
  nearPointer: false,
  distanceToCamera: 3,
  transformDelta: 0.001,
  materialChanged: false,
  screenCoverage: 0.2,
  semanticWeight: 0.8,
  motionWeight: 0.6,
  detailWeight: 0.7,
  heroWeight: 0.9,
  occluded: false,
  ...overrides,
});

const makeUI = (overrides: Partial<UIElementSnapshot> = {}): UIElementSnapshot => ({
  id: 'ui-el',
  isPrimary: true,
  isSecondary: false,
  blocksProgress: true,
  visible: true,
  inViewport: true,
  interactionWeight: 1.0,
  semanticWeight: 1.0,
  ...overrides,
});

const route: RouteSignals = {
  route: '/showcase',
  activeTask: 'hero_showcase_detail',
  primaryIntent: 'open_detail',
  nextLikelyRoutes: ['/product/123', '/cart'],
};

const runtime: RuntimeMetrics = {
  frameMs: 14.4,
  avgFrameMs: 15.2,
  cpuMs: 5.7,
  gpuMs: 8.2,
  droppedFrameRatio: 0.03,
  inputLatencyMs: 24,
  scrollVelocity: 0.08,
  pointerVelocity: 0.2,
  interactionBurst: 0.2,
};

const ux: UXSignals = {
  repeatTapCount: 0,
  rageTapCount: 0,
  hesitationMs: 220,
  backtrackCount: 0,
  correctionCount: 0,
  deadTapCount: 0,
};

const device: DeviceSignals = {
  dpr: 3,
  width: 430,
  height: 932,
  refreshRate: 120,
  prefersReducedMotion: false,
};

// ─── RingAverage ──────────────────────────────────────────────────────────────

describe('RingAverage', () => {
  it('returns 0 on empty ring', () => {
    const r = new RingAverage(4);
    expect(r.avg()).toBe(0);
  });

  it('averages values correctly', () => {
    const r = new RingAverage(4);
    r.push(10);
    r.push(20);
    expect(r.avg()).toBe(15);
  });

  it('wraps correctly when ring is full', () => {
    const r = new RingAverage(3);
    r.push(10);
    r.push(20);
    r.push(30);
    // Ring full: avg = 20
    expect(r.avg()).toBe(20);
    // Push 40 — oldest (10) evicted
    r.push(40);
    expect(r.avg()).toBeCloseTo((20 + 30 + 40) / 3);
  });
});

// ─── maxAssumptionBoot ────────────────────────────────────────────────────────

describe('maxAssumptionBoot', () => {
  it('returns GOD_TIER mode', () => {
    const result = maxAssumptionBoot(device);
    expect(result.mode).toBe('GOD_TIER');
  });

  it('increases intensity for high-DPR devices', () => {
    const low  = maxAssumptionBoot({ dpr: 1, width: 390, height: 844 });
    const high = maxAssumptionBoot({ dpr: 3, width: 430, height: 932, refreshRate: 120 });
    expect(high.globalIntensity).toBeGreaterThan(low.globalIntensity);
  });

  it('caps globalIntensity at 1.15', () => {
    const result = maxAssumptionBoot({ dpr: 10, width: 4000, height: 4000, refreshRate: 240 });
    expect(result.globalIntensity).toBeLessThanOrEqual(1.15);
  });

  it('caps baseResolutionScale at 1.25', () => {
    const result = maxAssumptionBoot({ dpr: 10, width: 4000, height: 4000, refreshRate: 240 });
    expect(result.baseResolutionScale).toBeLessThanOrEqual(1.25);
  });
});

// ─── framePressureShield ──────────────────────────────────────────────────────

describe('framePressureShield', () => {
  it('returns pressureLevel 0 for fast frames', () => {
    const result = framePressureShield({ ...runtime, avgFrameMs: 13, droppedFrameRatio: 0.01 });
    expect(result.pressureLevel).toBe(0);
  });

  it('returns pressureLevel 1 for mild pressure', () => {
    const result = framePressureShield({ ...runtime, avgFrameMs: 16.5, droppedFrameRatio: 0.02 });
    expect(result.pressureLevel).toBe(1);
  });

  it('returns pressureLevel 3 for severe pressure', () => {
    const result = framePressureShield({ ...runtime, avgFrameMs: 25, droppedFrameRatio: 0.2 });
    expect(result.pressureLevel).toBe(3);
    expect(result.preserveBloom).toBe(false);
    expect(result.preserveSSAO).toBe(false);
  });

  it('always preserves input', () => {
    const r = framePressureShield({ ...runtime, avgFrameMs: 50 });
    expect(r.preserveInput).toBe(true);
  });
});

// ─── fidelityScaler ───────────────────────────────────────────────────────────

describe('fidelityScaler', () => {
  it('reduces scale under high frame pressure', () => {
    const stressed = fidelityScaler({ ...runtime, avgFrameMs: 25, droppedFrameRatio: 0 }, 1.0);
    expect(stressed).toBeLessThan(1.0);
  });

  it('increases scale when frames are fast', () => {
    const fast = fidelityScaler({ ...runtime, avgFrameMs: 12, droppedFrameRatio: 0.01 }, 1.0);
    expect(fast).toBeGreaterThanOrEqual(1.0);
  });

  it('clamps to [0.88, 1.3]', () => {
    const low  = fidelityScaler({ ...runtime, avgFrameMs: 100 }, 0.5);
    const high = fidelityScaler({ ...runtime, avgFrameMs: 5, droppedFrameRatio: 0 }, 1.35);
    expect(low).toBeGreaterThanOrEqual(0.88);
    expect(high).toBeLessThanOrEqual(1.3);
  });
});

// ─── heroObjectImportance ─────────────────────────────────────────────────────

describe('heroObjectImportance', () => {
  it('gives high score to visible interactive mesh near camera', () => {
    const score = heroObjectImportance(makeMesh({ visible: true, interactive: true, distanceToCamera: 1.0 }), route);
    expect(score).toBeGreaterThan(50);
  });

  it('penalises invisible meshes heavily', () => {
    const visible  = heroObjectImportance(makeMesh({ visible: true }), route);
    const invisible = heroObjectImportance(makeMesh({ visible: false }), route);
    expect(invisible).toBeLessThan(visible);
  });

  it('clamps result to [0, 100]', () => {
    const high = heroObjectImportance(makeMesh({ visible: true, interactive: true, heroWeight: 1, semanticWeight: 1 }), route);
    const low  = heroObjectImportance(makeMesh({ visible: false, occluded: true, distanceToCamera: 20 }), route);
    expect(high).toBeLessThanOrEqual(100);
    expect(low).toBeGreaterThanOrEqual(0);
  });
});

// ─── eliteMeshPolicy ─────────────────────────────────────────────────────────

describe('eliteMeshPolicy', () => {
  it('freezes truly dead meshes', () => {
    const decision = eliteMeshPolicy(
      makeMesh({ visible: false, interactive: false, nearPointer: false, transformDelta: 0.000001, materialChanged: false }),
      0, // importance < 10
      0,
    );
    expect(decision.freeze).toBe(true);
    expect(decision.updateHz).toBe(1);
  });

  it('does not freeze visible interactive meshes', () => {
    const decision = eliteMeshPolicy(makeMesh({ visible: true, interactive: true }), 80, 0);
    expect(decision.freeze).toBe(false);
    expect(decision.updateHz).toBe(60);
  });

  it('sets forceHeroShadows for high-importance meshes', () => {
    const decision = eliteMeshPolicy(makeMesh(), 55, 0);
    expect(decision.forceHeroShadows).toBe(true);
  });

  it('sets forceHighQualityMaterial for importance >= 34', () => {
    const decision = eliteMeshPolicy(makeMesh(), 40, 0);
    expect(decision.forceHighQualityMaterial).toBe(true);
  });
});

// ─── cinematicMotionStack ─────────────────────────────────────────────────────

describe('cinematicMotionStack', () => {
  it('returns reduced-motion plan when reducedMotion=true', () => {
    const plan = cinematicMotionStack(runtime, true);
    expect(plan.allowAmbient).toBe(false);
    expect(plan.allowParallax).toBe(false);
    expect(plan.allowRouteTakeover).toBe(false);
    expect(plan.ambientMs).toBe(0);
  });

  it('returns full plan for normal conditions', () => {
    const plan = cinematicMotionStack({ ...runtime, avgFrameMs: 14 }, false);
    expect(plan.allowAmbient).toBe(true);
    expect(plan.allowParallax).toBe(true);
    expect(plan.routeMs).toBe(360);
  });

  it('uses shorter durations under frame stress', () => {
    const stressed = cinematicMotionStack({ ...runtime, avgFrameMs: 22 }, false);
    const relaxed  = cinematicMotionStack({ ...runtime, avgFrameMs: 12 }, false);
    expect(stressed.heroMs).toBeLessThan(relaxed.heroMs);
    expect(stressed.routeMs).toBeLessThan(relaxed.routeMs);
  });
});

// ─── visualDominanceEngine ────────────────────────────────────────────────────

describe('visualDominanceEngine', () => {
  it('boosts primary contrast when user is struggling', () => {
    const strug = visualDominanceEngine(route, { ...ux, rageTapCount: 2 });
    const normal = visualDominanceEngine(route, ux);
    expect(strug.primaryContrast).toBeGreaterThan(normal.primaryContrast);
  });

  it('boosts blur / shadow in showcase mode', () => {
    const showcase = visualDominanceEngine({ ...route, activeTask: 'hero_showcase' }, ux);
    const browse   = visualDominanceEngine({ ...route, activeTask: 'browse' }, ux);
    expect(showcase.blurStrength).toBeGreaterThan(browse.blurStrength);
  });

  it('raises primaryScale for transactional routes', () => {
    const checkout = visualDominanceEngine({ ...route, activeTask: 'checkout' }, ux);
    const normal   = visualDominanceEngine({ ...route, activeTask: 'browse' }, ux);
    expect(checkout.primaryScale).toBeGreaterThan(normal.primaryScale);
  });
});

// ─── predictIntent ────────────────────────────────────────────────────────────

describe('predictIntent', () => {
  it('predicts navigate_route when next routes are provided', () => {
    const intent = predictIntent(route, runtime, ux);
    expect(intent.type).toBe('open_detail'); // primaryIntent='open_detail' overrides
    expect(intent.confidence).toBeGreaterThan(0.6);
  });

  it('predicts continue_scroll when scroll velocity is high', () => {
    const intent = predictIntent(
      { ...route, primaryIntent: 'unknown', nextLikelyRoutes: [] },
      { ...runtime, scrollVelocity: 0.9 },
      ux,
    );
    expect(intent.type).toBe('continue_scroll');
  });

  it('reduces confidence on rage/dead taps', () => {
    const normal = predictIntent(route, runtime, ux);
    const angry  = predictIntent(route, runtime, { ...ux, rageTapCount: 1 });
    expect(angry.confidence).toBeLessThan(normal.confidence);
  });

  it('enables optimistic feedback above 0.66 confidence', () => {
    const intent = predictIntent(route, runtime, ux);
    expect(intent.optimisticFeedback).toBe(true);
  });
});

// ─── speculativePrefetchEngine ────────────────────────────────────────────────

describe('speculativePrefetchEngine', () => {
  it('always includes critical prefetch for current route', () => {
    const intent = predictIntent(route, runtime, ux);
    const plan   = speculativePrefetchEngine(route, intent);
    expect(plan[0].key).toBe(`critical:${route.route}`);
    expect(plan[0].priority).toBe(100);
  });

  it('includes next route prefetch when available', () => {
    const intent = predictIntent(route, runtime, ux);
    const plan   = speculativePrefetchEngine(route, intent);
    const hasNext = plan.some((p) => p.key.startsWith('next:'));
    expect(hasNext).toBe(true);
  });

  it('is sorted descending by priority', () => {
    const intent = predictIntent(route, runtime, ux);
    const plan   = speculativePrefetchEngine(route, intent);
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i - 1].priority).toBeGreaterThanOrEqual(plan[i].priority);
    }
  });
});

// ─── frictionOverride ─────────────────────────────────────────────────────────

describe('frictionOverride', () => {
  it('returns empty array when there is no friction', () => {
    const result = frictionOverride(ux, route);
    expect(result).toEqual([]);
  });

  it('suggests hit-target enlargement on dead taps', () => {
    const result = frictionOverride({ ...ux, deadTapCount: 1 }, route);
    expect(result).toContain('enlarge_primary_hit_targets');
    expect(result).toContain('instant_press_feedback');
  });

  it('suggests persistence on backtrack', () => {
    const result = frictionOverride({ ...ux, backtrackCount: 1 }, route);
    expect(result).toContain('persist_previous_selection');
  });

  it('pins CTA on checkout routes', () => {
    const result = frictionOverride(ux, { ...route, activeTask: 'checkout_final' });
    expect(result).toContain('pin_cta');
    expect(result).toContain('pin_total');
  });

  it('deduplicates overrides', () => {
    const result = frictionOverride({ ...ux, rageTapCount: 1, deadTapCount: 1 }, route);
    expect(new Set(result).size).toBe(result.length);
  });
});

// ─── uiPrioritySolver ─────────────────────────────────────────────────────────

describe('uiPrioritySolver', () => {
  it('ranks primary CTAs first', () => {
    const elements = [
      makeUI({ id: 'cta', isPrimary: true, blocksProgress: true }),
      makeUI({ id: 'secondary', isPrimary: false, isSecondary: true, blocksProgress: false, interactionWeight: 0.3 }),
    ];
    const result = uiPrioritySolver(elements, ux);
    expect(result[0].id).toBe('cta');
    expect(result[0].priorityRank).toBe(1);
  });

  it('boosts primary and dims secondary when user is struggling', () => {
    const elements = [
      makeUI({ id: 'primary', isPrimary: true }),
      makeUI({ id: 'secondary', isPrimary: false, isSecondary: true }),
    ];
    const normalResult    = uiPrioritySolver(elements, ux);
    const strugglingResult = uiPrioritySolver(elements, { ...ux, rageTapCount: 2 });

    const primaryNormal    = normalResult.find((e) => e.id === 'primary')!;
    const primaryStruggling = strugglingResult.find((e) => e.id === 'primary')!;
    expect(primaryStruggling.prominence).toBeGreaterThan(primaryNormal.prominence);
  });

  it('assigns sequential priority ranks', () => {
    const elements = [makeUI({ id: 'a' }), makeUI({ id: 'b', isPrimary: false, isSecondary: true })];
    const result = uiPrioritySolver(elements, ux);
    const ranks = result.map((r) => r.priorityRank).sort((a, b) => a - b);
    expect(ranks).toEqual([1, 2]);
  });
});

// ─── applyGodTierToBabylon ────────────────────────────────────────────────────

describe('applyGodTierToBabylon', () => {
  it('sets hardware scaling level on the engine', () => {
    let captured = -1;
    const mockEngine: BabylonEngineLike = {
      setHardwareScalingLevel: (level) => { captured = level; },
    };
    const system = new DreamEngineGodTierSystem();
    const state = system.update({
      device:  defaultDeviceSignals(),
      runtime: defaultRuntimeMetrics(),
      ux:      defaultUXSignals(),
      route:   defaultRouteSignals('/'),
      meshes:  [],
      ui:      [],
    });

    applyGodTierToBabylon(mockEngine, { meshes: [] }, state, 1);
    expect(captured).toBeGreaterThanOrEqual(0.72);
  });

  it('freezes dead meshes', () => {
    let froze = false;
    const mockScene: BabylonSceneLike = {
      meshes: [{
        id: 'dead-mesh',
        isWorldMatrixFrozen: false,
        isVisible: false,
        freezeWorldMatrix: () => { froze = true; },
        unfreezeWorldMatrix: () => {},
      }],
    };

    const system = new DreamEngineGodTierSystem();
    const state = system.update({
      device:  defaultDeviceSignals(),
      runtime: defaultRuntimeMetrics(),
      ux:      defaultUXSignals(),
      route:   defaultRouteSignals('/'),
      meshes: [{
        id: 'dead-mesh', visible: false, interactive: false, nearPointer: false,
        distanceToCamera: 20, transformDelta: 0.000001, materialChanged: false,
        screenCoverage: 0, semanticWeight: 0, motionWeight: 0, detailWeight: 0,
        heroWeight: 0, occluded: true,
      }],
      ui: [],
    });

    const mockEngine: BabylonEngineLike = { setHardwareScalingLevel: () => {} };
    applyGodTierToBabylon(mockEngine, mockScene, state, 1);
    expect(froze).toBe(true);
  });

  it('applies imageProcessingConfiguration when available', () => {
    const ipc = { contrast: 0, exposure: 0, toneMappingEnabled: false, vignetteEnabled: true };
    const mockScene: BabylonSceneLike = { meshes: [], imageProcessingConfiguration: ipc };
    const mockEngine: BabylonEngineLike = { setHardwareScalingLevel: () => {} };

    const state = new DreamEngineGodTierSystem().update({
      device: defaultDeviceSignals(), runtime: defaultRuntimeMetrics(),
      ux: defaultUXSignals(), route: defaultRouteSignals('/'),
      meshes: [], ui: [],
    });

    applyGodTierToBabylon(mockEngine, mockScene, state, 1);
    expect(ipc.contrast).toBe(1.1);
    expect(ipc.toneMappingEnabled).toBe(true);
    expect(ipc.vignetteEnabled).toBe(false);
  });
});

// ─── getGodTierUiTokens ───────────────────────────────────────────────────────

describe('getGodTierUiTokens', () => {
  it('returns classes string including god-tier-ui', () => {
    const state = new DreamEngineGodTierSystem().update({
      device: device, runtime, ux, route,
      meshes: [makeMesh()],
      ui: [makeUI()],
    });
    const tokens = getGodTierUiTokens(state);
    expect(tokens.classes).toContain('god-tier-ui');
    expect(tokens.classes).toContain('scene-dominant');
  });

  it('returns all expected CSS variable keys', () => {
    const state = new DreamEngineGodTierSystem().update({
      device, runtime, ux, route, meshes: [], ui: [],
    });
    const { vars } = getGodTierUiTokens(state);
    expect(vars['--gt-primary-scale']).toBeDefined();
    expect(vars['--gt-motion-route']).toMatch(/ms$/);
    expect(vars['--gt-global-intensity']).toBeDefined();
  });

  it('emits parallax-on when parallax is allowed', () => {
    const state = new DreamEngineGodTierSystem().update({
      device, runtime: { ...runtime, avgFrameMs: 14 }, ux, route, meshes: [], ui: [],
    });
    const tokens = getGodTierUiTokens(state);
    expect(tokens.classes).toContain('parallax-on');
  });
});

// ─── DreamEngineGodTierSystem (full orchestrator) ─────────────────────────────

describe('DreamEngineGodTierSystem', () => {
  let system: DreamEngineGodTierSystem;

  beforeEach(() => {
    system = new DreamEngineGodTierSystem();
  });

  it('returns mode GOD_TIER', () => {
    const state = system.update({ device, runtime, ux, route, meshes: [], ui: [] });
    expect(state.mode).toBe('GOD_TIER');
  });

  it('returns renderPlan with targetFps=60', () => {
    const state = system.update({ device, runtime, ux, route, meshes: [], ui: [] });
    expect(state.renderPlan.targetFps).toBe(60);
    expect(state.renderPlan.renderEveryFrame).toBe(true);
    expect(state.renderPlan.sceneMode).toBe('DOMINANT');
  });

  it('emits meshDecisions for every mesh', () => {
    const meshes = [makeMesh({ id: 'a' }), makeMesh({ id: 'b' })];
    const state = system.update({ device, runtime, ux, route, meshes, ui: [] });
    expect(state.meshDecisions).toHaveLength(2);
    expect(state.meshDecisions.map((d) => d.id)).toEqual(['a', 'b']);
  });

  it('emits uiHierarchy for every UI element', () => {
    const ui = [makeUI({ id: 'cta' }), makeUI({ id: 'nav' })];
    const state = system.update({ device, runtime, ux, route, meshes: [], ui });
    expect(state.uiHierarchy).toHaveLength(2);
  });

  it('includes prefetchPlan with at least 3 entries', () => {
    const state = system.update({ device, runtime, ux, route, meshes: [], ui: [] });
    expect(state.prefetchPlan.length).toBeGreaterThanOrEqual(3);
  });

  it('globalIntensity is between 0 and 1.15', () => {
    const state = system.update({ device, runtime, ux, route, meshes: [], ui: [] });
    expect(state.globalIntensity).toBeGreaterThan(0);
    expect(state.globalIntensity).toBeLessThanOrEqual(1.15);
  });

  it('state is consistent across multiple ticks', () => {
    const s1 = system.update({ device, runtime, ux, route, meshes: [], ui: [] });
    const s2 = system.update({ device, runtime, ux, route, meshes: [], ui: [] });
    expect(s1.mode).toBe(s2.mode);
    expect(s1.renderPlan.sceneMode).toBe(s2.renderPlan.sceneMode);
  });
});

// ─── defaultSignals ───────────────────────────────────────────────────────────

describe('default signal helpers', () => {
  it('defaultDeviceSignals returns valid structure in non-browser', () => {
    const d = defaultDeviceSignals();
    expect(typeof d.dpr).toBe('number');
    expect(typeof d.width).toBe('number');
  });

  it('defaultRuntimeMetrics has positive frameMs', () => {
    const r = defaultRuntimeMetrics();
    expect(r.frameMs).toBeGreaterThan(0);
  });

  it('defaultUXSignals all start at 0', () => {
    const u = defaultUXSignals();
    expect(u.rageTapCount).toBe(0);
    expect(u.deadTapCount).toBe(0);
  });

  it('defaultRouteSignals uses provided route', () => {
    const r = defaultRouteSignals('/test');
    expect(r.route).toBe('/test');
  });
});
