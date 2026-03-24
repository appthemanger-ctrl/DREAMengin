/**
 * Tests for lib/webgpu/director.ts — DREAM_ENGINE_WEBGPU_DIRECTOR.
 *
 * Covers all exported pure functions and the WebGPUDirector class.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  classifyPressure,
  buildPassPlan,
  scoreObject,
  classifyObject,
  decideObject,
  resolveFrameBudget,
  resolveTemporalState,
  resolveResolutionScale,
  applyDirectorFrame,
  WebGPUDirector,
  defaultDirectorMetrics,
  defaultCameraSignals,
  type RuntimeMetrics,
  type CameraSignals,
  type SceneObject,
  type DirectorBabylonEngine,
  type DirectorBabylonScene,
  type DirectorBabylonMesh,
} from '@/lib/webgpu/director';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const nominalMetrics = (): RuntimeMetrics => ({
  frameMs:           16.0,
  avgFrameMs:        16.0,
  gpuMs:             7.0,
  cpuMs:             3.5,
  droppedFrameRatio: 0,
  uploadMs:          0.8,
});

const pressuredMetrics = (avg: number, dropped = 0): RuntimeMetrics => ({
  ...nominalMetrics(),
  avgFrameMs: avg,
  droppedFrameRatio: dropped,
});

const heroCamera = (): CameraSignals => ({
  state: 'hero',
  velocity: 0,
  cutActive: false,
});

const browseCamera = (): CameraSignals => ({
  state: 'browse',
  velocity: 0,
  cutActive: false,
});

const makeObject = (overrides: Partial<SceneObject> = {}): SceneObject => ({
  id:                 'obj-1',
  visible:            true,
  occluded:           false,
  transparent:        false,
  skinned:            false,
  screenCoverage:     0.25,
  distance:           3,
  heroWeight:         0.8,
  semanticWeight:     0.7,
  motionWeight:       0.4,
  interactionWeight:  0.3,
  materialCost:       0.2,
  shadowCost:         0.2,
  geometryCost:       0.2,
  textureCost:        0.2,
  lastFrameVisible:   true,
  ...overrides,
});

// ─── classifyPressure ─────────────────────────────────────────────────────────

describe('classifyPressure', () => {
  it('returns 0 for nominal metrics', () => {
    expect(classifyPressure(nominalMetrics())).toBe(0);
  });

  it('returns 1 for mildly elevated avgFrameMs', () => {
    expect(classifyPressure(pressuredMetrics(18))).toBe(1);
  });

  it('returns 2 for medium pressure', () => {
    expect(classifyPressure(pressuredMetrics(21))).toBe(2);
  });

  it('returns 3 for high dropped frames', () => {
    expect(classifyPressure(pressuredMetrics(16, 0.20))).toBe(3);
  });

  it('returns 3 for very high avgFrameMs', () => {
    expect(classifyPressure(pressuredMetrics(26))).toBe(3);
  });

  it('returns 3 for very high gpuMs', () => {
    const m = { ...nominalMetrics(), gpuMs: 25 };
    expect(classifyPressure(m)).toBe(3);
  });
});

// ─── buildPassPlan ────────────────────────────────────────────────────────────

describe('buildPassPlan', () => {
  it('enables all hero passes at pressure 0 with hero camera', () => {
    const plan = buildPassPlan(0, heroCamera());
    expect(plan.depth_prepass.enabled).toBe(true);
    expect(plan.shadow_pass.enabled).toBe(true);
    expect(plan.gbuffer.enabled).toBe(true);
    expect(plan.ssao.enabled).toBe(true);
    expect(plan.bloom.enabled).toBe(true);
    expect(plan.dof.enabled).toBe(true);
    expect(plan.taa.enabled).toBe(true);
    expect(plan.tonemap.enabled).toBe(true);
    expect(plan.ui.enabled).toBe(true);
  });

  it('disables dof under pressure 3', () => {
    const plan = buildPassPlan(3, heroCamera());
    expect(plan.dof.enabled).toBe(false);
  });

  it('disables ssao under pressure 2', () => {
    const plan = buildPassPlan(2, browseCamera());
    expect(plan.ssao.enabled).toBe(false);
  });

  it('disables shadow_pass for utility camera at pressure 3', () => {
    const utilCam: CameraSignals = { state: 'utility', velocity: 0, cutActive: false };
    const plan = buildPassPlan(3, utilCam);
    expect(plan.shadow_pass.enabled).toBe(false);
  });

  it('always enables depth_prepass, lighting, tonemap, ui', () => {
    const utilCam: CameraSignals = { state: 'utility', velocity: 0, cutActive: false };
    const plan = buildPassPlan(3, utilCam);
    expect(plan.depth_prepass.enabled).toBe(true);
    expect(plan.lighting.enabled).toBe(true);
    expect(plan.tonemap.enabled).toBe(true);
    expect(plan.ui.enabled).toBe(true);
  });

  it('disables taa on camera cut', () => {
    const cam: CameraSignals = { state: 'hero', velocity: 0, cutActive: true };
    const plan = buildPassPlan(0, cam);
    expect(plan.taa.enabled).toBe(false);
  });

  it('shadow_pass gets full resolution for hero camera at pressure 0', () => {
    const plan = buildPassPlan(0, heroCamera());
    expect(plan.shadow_pass.resolutionScale).toBe(1.0);
  });

  it('shadow_pass gets half resolution for browse camera', () => {
    const plan = buildPassPlan(0, browseCamera());
    expect(plan.shadow_pass.resolutionScale).toBe(0.5);
  });
});

// ─── scoreObject ──────────────────────────────────────────────────────────────

describe('scoreObject', () => {
  it('returns 0 for invisible object', () => {
    expect(scoreObject(makeObject({ visible: false }), heroCamera())).toBe(0);
  });

  it('returns 0 for occluded object', () => {
    expect(scoreObject(makeObject({ occluded: true }), heroCamera())).toBe(0);
  });

  it('returns higher score for focus target', () => {
    const cam: CameraSignals = { state: 'hero', velocity: 0, cutActive: false, focusTargetId: 'obj-1' };
    const baseScore  = scoreObject(makeObject(), heroCamera());
    const focusScore = scoreObject(makeObject(), cam);
    expect(focusScore).toBeGreaterThan(baseScore);
  });

  it('scores between 0 and 100', () => {
    const score = scoreObject(makeObject(), heroCamera());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('large screen coverage increases score', () => {
    const small = scoreObject(makeObject({ screenCoverage: 0.01 }), browseCamera());
    const large = scoreObject(makeObject({ screenCoverage: 0.90 }), browseCamera());
    expect(large).toBeGreaterThan(small);
  });
});

// ─── classifyObject ───────────────────────────────────────────────────────────

describe('classifyObject', () => {
  it('classifies importance 0 as culled', () => {
    expect(classifyObject(0, 0)).toBe('culled');
  });

  it('classifies very low importance as culled', () => {
    expect(classifyObject(4, 0)).toBe('culled');
  });

  it('classifies high importance as hero', () => {
    expect(classifyObject(80, 0)).toBe('hero');
  });

  it('classifies mid importance as primary at low pressure', () => {
    expect(classifyObject(55, 1)).toBe('primary');
  });

  it('classifies mid importance as secondary at high pressure', () => {
    expect(classifyObject(35, 3)).toBe('secondary');
  });

  it('classifies background-level importance as background', () => {
    expect(classifyObject(10, 0)).toBe('background');
  });
});

// ─── decideObject ─────────────────────────────────────────────────────────────

describe('decideObject', () => {
  it('freezes invisible non-moving objects', () => {
    const obj = makeObject({
      visible:          false,
      lastFrameVisible: false,
      motionWeight:     0,
    });
    const d = decideObject(obj, browseCamera(), 0);
    expect(d.freeze).toBe(true);
  });

  it('does not freeze visible hero objects', () => {
    const d = decideObject(makeObject(), heroCamera(), 0);
    expect(d.freeze).toBe(false);
  });

  it('returns LOD 0 for high-importance objects at low pressure', () => {
    const d = decideObject(makeObject({ heroWeight: 1, screenCoverage: 0.9 }), heroCamera(), 0);
    expect(d.lodLevel).toBe(0);
  });

  it('enables high quality material for hero objects at low pressure', () => {
    const cam: CameraSignals = { state: 'hero', velocity: 0, cutActive: false, focusTargetId: 'obj-1' };
    const d = decideObject(makeObject({ heroWeight: 1, screenCoverage: 0.9, semanticWeight: 1 }), cam, 0);
    expect(d.highQualityMaterial).toBe(true);
  });

  it('applies mip bias 2 for unimportant objects at pressure 3', () => {
    const obj = makeObject({
      visible:          false,
      lastFrameVisible: false,
      heroWeight:       0,
      semanticWeight:   0,
      motionWeight:     0.1,
      screenCoverage:   0.01,
    });
    const d = decideObject(obj, browseCamera(), 3);
    expect(d.textureMipBias).toBe(2);
  });

  it('shadow casting requires sufficient importance', () => {
    // Very low importance object should not cast shadow
    const obj = makeObject({
      visible:        false,
      occluded:       true,
      heroWeight:     0,
      semanticWeight: 0,
      screenCoverage: 0,
    });
    const d = decideObject(obj, browseCamera(), 0);
    expect(d.castShadow).toBe(false);
  });
});

// ─── resolveFrameBudget ───────────────────────────────────────────────────────

describe('resolveFrameBudget', () => {
  it('is within budget for nominal metrics', () => {
    const b = resolveFrameBudget(nominalMetrics(), 0);
    expect(b.withinBudget).toBe(true);
  });

  it('reports over budget when gpuMs exceeds allocation', () => {
    const m: RuntimeMetrics = { ...nominalMetrics(), gpuMs: 20 };
    const b = resolveFrameBudget(m, 0);
    expect(b.withinBudget).toBe(false);
  });

  it('target budget is relaxed at pressure 3', () => {
    const b0 = resolveFrameBudget(nominalMetrics(), 0);
    const b3 = resolveFrameBudget(nominalMetrics(), 3);
    expect(b3.gpuBudgetMs).toBeGreaterThan(b0.gpuBudgetMs);
  });

  it('budget components sum to the target', () => {
    const b = resolveFrameBudget(nominalMetrics(), 0);
    const sum = b.gpuBudgetMs + b.cpuBudgetMs + b.uploadBudgetMs;
    expect(sum).toBeCloseTo(16.6, 1);
  });
});

// ─── resolveTemporalState ─────────────────────────────────────────────────────

describe('resolveTemporalState', () => {
  it('enables TAA at pressure 0 without cut', () => {
    const t = resolveTemporalState(heroCamera(), 0);
    expect(t.taaEnabled).toBe(true);
  });

  it('disables TAA on camera cut', () => {
    const cam: CameraSignals = { state: 'hero', velocity: 0, cutActive: true };
    const t = resolveTemporalState(cam, 0);
    expect(t.taaEnabled).toBe(false);
    expect(t.historyInvalidated).toBe(true);
  });

  it('disables TAA at pressure 3', () => {
    const t = resolveTemporalState(heroCamera(), 3);
    expect(t.taaEnabled).toBe(false);
  });

  it('reduces taa frame count at high velocity', () => {
    const fastCam: CameraSignals = { state: 'browse', velocity: 0.8, cutActive: false };
    const t = resolveTemporalState(fastCam, 0);
    expect(t.taaFrameCount).toBe(2);
  });

  it('uses 8 frames at low velocity and pressure 0', () => {
    const t = resolveTemporalState(heroCamera(), 0);
    expect(t.taaFrameCount).toBe(8);
  });

  it('sets jitter to 0 when taa disabled', () => {
    const cam: CameraSignals = { state: 'hero', velocity: 0, cutActive: true };
    const t = resolveTemporalState(cam, 0);
    expect(t.jitterScale).toBe(0);
  });
});

// ─── resolveResolutionScale ───────────────────────────────────────────────────

describe('resolveResolutionScale', () => {
  it('returns 1.0 at pressure 0 for hero camera', () => {
    expect(resolveResolutionScale(0, heroCamera())).toBe(1.0);
  });

  it('drops to 0.75 at pressure 3', () => {
    expect(resolveResolutionScale(3, heroCamera())).toBe(0.75);
  });

  it('returns 0.75 for utility camera regardless of pressure', () => {
    const cam: CameraSignals = { state: 'utility', velocity: 0, cutActive: false };
    expect(resolveResolutionScale(0, cam)).toBe(0.75);
  });

  it('transition camera is slightly lower than hero at same pressure', () => {
    const transition: CameraSignals = { state: 'transition', velocity: 0, cutActive: false };
    const scaleHero       = resolveResolutionScale(0, heroCamera());
    const scaleTransition = resolveResolutionScale(0, transition);
    expect(scaleTransition).toBeLessThan(scaleHero);
  });

  it('never goes below 0.67', () => {
    const transition: CameraSignals = { state: 'transition', velocity: 0, cutActive: false };
    expect(resolveResolutionScale(3, transition)).toBeGreaterThanOrEqual(0.67);
  });
});

// ─── WebGPUDirector ───────────────────────────────────────────────────────────

describe('WebGPUDirector', () => {
  let director: WebGPUDirector;

  beforeEach(() => {
    director = new WebGPUDirector();
  });

  it('returns a valid DirectorFrame', () => {
    const frame = director.update({
      metrics: nominalMetrics(),
      camera:  heroCamera(),
      objects: [makeObject()],
    });

    expect(frame.pressure).toBe(0);
    expect(frame.resolutionScale).toBe(1.0);
    expect(frame.objectDecisions).toHaveLength(1);
    expect(typeof frame.passPlan.depth_prepass.enabled).toBe('boolean');
  });

  it('downgrades pressure immediately on bad frame', () => {
    const badMetrics = pressuredMetrics(26);
    const frame = director.update({
      metrics: badMetrics,
      camera:  browseCamera(),
      objects: [],
    });
    expect(frame.pressure).toBe(3);
  });

  it('applies hysteresis when recovering from high pressure', () => {
    // Push to pressure 3
    director.update({ metrics: pressuredMetrics(26), camera: browseCamera(), objects: [] });

    // Recovery frame (nominal metrics) — should still report high pressure for several frames
    const frame = director.update({
      metrics: nominalMetrics(),
      camera:  browseCamera(),
      objects: [],
    });
    // Still held at previous pressure due to hysteresis
    expect(frame.pressure).toBeGreaterThan(0);
  });

  it('includes frameBudget and temporal in every frame', () => {
    const frame = director.update({
      metrics: nominalMetrics(),
      camera:  heroCamera(),
      objects: [],
    });
    expect(frame.frameBudget).toBeDefined();
    expect(frame.temporal).toBeDefined();
    expect(typeof frame.frameBudget.gpuBudgetMs).toBe('number');
    expect(typeof frame.temporal.taaEnabled).toBe('boolean');
  });
});

// ─── applyDirectorFrame ───────────────────────────────────────────────────────

describe('applyDirectorFrame', () => {
  const makeMesh = (id: string, frozen = false): DirectorBabylonMesh => ({
    id,
    isWorldMatrixFrozen: frozen,
    isVisible: true,
    freezeWorldMatrix:   vi.fn(),
    unfreezeWorldMatrix: vi.fn(),
  });

  const makeEngine = (): DirectorBabylonEngine => ({
    setHardwareScalingLevel: vi.fn(),
  });

  const makeScene = (meshes: DirectorBabylonMesh[]): DirectorBabylonScene => ({
    meshes,
    imageProcessingConfiguration: {
      contrast:           1.0,
      exposure:           1.0,
      toneMappingEnabled: false,
      vignetteEnabled:    true,
    },
  });

  it('calls setHardwareScalingLevel', () => {
    const engine = makeEngine();
    const director = new WebGPUDirector();
    const frame = director.update({ metrics: nominalMetrics(), camera: heroCamera(), objects: [] });
    applyDirectorFrame(engine, makeScene([]), frame);
    expect(engine.setHardwareScalingLevel).toHaveBeenCalledOnce();
  });

  it('freezes a mesh when the decision says freeze', () => {
    const mesh = makeMesh('frozen-obj', false);
    const scene = makeScene([mesh]);
    const engine = makeEngine();

    // Build a director frame where the object is culled/frozen
    const director = new WebGPUDirector();
    const frame = director.update({
      metrics: nominalMetrics(),
      camera:  browseCamera(),
      objects: [makeObject({
        id:               'frozen-obj',
        visible:          false,
        lastFrameVisible: false,
        motionWeight:     0,
        heroWeight:       0,
        semanticWeight:   0,
        screenCoverage:   0,
      })],
    });

    applyDirectorFrame(engine, scene, frame);
    expect(mesh.freezeWorldMatrix).toHaveBeenCalled();
  });

  it('updates imageProcessingConfiguration', () => {
    const engine = makeEngine();
    const scene  = makeScene([]);
    const director = new WebGPUDirector();
    const frame = director.update({ metrics: nominalMetrics(), camera: heroCamera(), objects: [] });
    applyDirectorFrame(engine, scene, frame);
    expect(scene.imageProcessingConfiguration?.contrast).toBe(1.1);
    expect(scene.imageProcessingConfiguration?.vignetteEnabled).toBe(false);
  });
});

// ─── default helpers ──────────────────────────────────────────────────────────

describe('default helpers', () => {
  it('defaultDirectorMetrics returns nominal values', () => {
    const m = defaultDirectorMetrics();
    expect(m.avgFrameMs).toBe(16.6);
    expect(m.droppedFrameRatio).toBe(0);
  });

  it('defaultCameraSignals returns browse state by default', () => {
    const c = defaultCameraSignals();
    expect(c.state).toBe('browse');
    expect(c.cutActive).toBe(false);
  });

  it('defaultCameraSignals accepts a state override', () => {
    const c = defaultCameraSignals('hero');
    expect(c.state).toBe('hero');
  });
});
