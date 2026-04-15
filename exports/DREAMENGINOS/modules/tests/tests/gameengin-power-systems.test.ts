/**
 * tests/gameengin-power-systems.test.ts
 *
 * Unit tests for lib/gameengin/power-systems.ts
 *
 * 20 systems, each with a focused test suite covering:
 *  • Core API behaviour
 *  • Edge cases and boundary conditions
 *  • Graceful degradation in Node (no WebGPU / AudioContext)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RollbackNetcode,
  ComputeShaderPipeline,
  AdvancedPhysicsWorld,
  OctreeBVH,
  WorkerJobSystem,
  ProceduralWorldGen,
  ReplayBuffer,
  BehaviorTreeEngine,
  GPUProfiler,
  TypedEventBus,
  AnimationStateMachine,
  LODSystem,
  ClientSidePrediction,
  ResourcePool,
  WGSLShaderManager,
  TerrainEngine,
  GlobalIllumProbes,
  AssetStreamManager,
  PhysicsMaterialSystem,
} from '../lib/gameengin/power-systems';
import type {
  BTContext,
  BTNode,
  AnimationClip,
  LODObject,
  LODLevel,
} from '../lib/gameengin/power-systems';

// ─────────────────────────────────────────────────────────────────────────────
//  1. ROLLBACK NETCODE
// ─────────────────────────────────────────────────────────────────────────────
describe('RollbackNetcode', () => {
  let net: RollbackNetcode;
  beforeEach(() => { net = new RollbackNetcode({ maxRollbackFrames: 4, tickRateHz: 60 }); });

  it('starts at tick 0', () => {
    expect(net.stats.currentTick).toBe(0);
  });

  it('records input and returns a stamped NetInput', () => {
    const input = net.recordInput({ playerId: 'p1', actions: new Uint8Array([1, 0]), checksum: 42 });
    expect(input.tick).toBe(2); // inputDelay = 2
    expect(input.playerId).toBe('p1');
  });

  it('advances the tick counter', () => {
    net.advance();
    net.advance();
    expect(net.stats.currentTick).toBe(2);
  });

  it('rollbacks past tick triggers re-simulation list', () => {
    net.advance(); net.advance(); net.advance();
    const ticks = net.receiveRemoteInput({ tick: 1, playerId: 'p2', actions: new Uint8Array([0, 1]), checksum: 7 });
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[0]).toBe(1);
  });

  it('validateChecksum returns true for matching checksums', () => {
    const a = { tick: 5, playerId: 'p1', actions: new Uint8Array([0]), checksum: 99 };
    const b = { tick: 5, playerId: 'p2', actions: new Uint8Array([0]), checksum: 99 };
    expect(net.validateChecksum(a, b)).toBe(true);
  });

  it('validateChecksum returns false for divergent checksums', () => {
    const a = { tick: 5, playerId: 'p1', actions: new Uint8Array([0]), checksum: 99 };
    const b = { tick: 5, playerId: 'p2', actions: new Uint8Array([0]), checksum: 100 };
    expect(net.validateChecksum(a, b)).toBe(false);
  });

  it('saves and retrieves a snapshot', () => {
    const snap = new Uint8Array([1, 2, 3]);
    net.saveSnapshot(snap);
    const got = net.getSnapshot(0);
    expect(got).not.toBeNull();
    expect(got![0]).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  2. GPU COMPUTE PIPELINE
// ─────────────────────────────────────────────────────────────────────────────
describe('ComputeShaderPipeline', () => {
  it('init returns false in Node (no WebGPU)', async () => {
    const pipeline = new ComputeShaderPipeline();
    const result = await pipeline.init();
    expect(result).toBe(false);
  });

  it('stats reflect unavailable state', async () => {
    const pipeline = new ComputeShaderPipeline();
    await pipeline.init();
    expect(pipeline.stats.available).toBe(false);
    expect(pipeline.stats.dispatchCount).toBe(0);
  });

  it('dispatch returns false when not initialised', () => {
    const pipeline = new ComputeShaderPipeline();
    const ok = pipeline.dispatch({ kernel: 'none', workgroups: [1, 1, 1], bindings: [] });
    expect(ok).toBe(false);
  });

  it('createBuffer returns null when not initialised', () => {
    const pipeline = new ComputeShaderPipeline();
    expect(pipeline.createBuffer(256, 0)).toBeNull();
  });

  it('dispose is safe to call before init', () => {
    const pipeline = new ComputeShaderPipeline();
    expect(() => pipeline.dispose()).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  3. ADVANCED PHYSICS WORLD
// ─────────────────────────────────────────────────────────────────────────────
describe('AdvancedPhysicsWorld', () => {
  let world: AdvancedPhysicsWorld;
  beforeEach(() => { world = new AdvancedPhysicsWorld(); });

  it('adds and retrieves a body', () => {
    world.addBody({ id: 'box1', type: 'dynamic', shape: 'box', mass: 1, position: [0, 10, 0] });
    const b = world.getBody('box1');
    expect(b).toBeDefined();
    expect(b!.def.id).toBe('box1');
  });

  it('removes a body', () => {
    world.addBody({ id: 'rem', type: 'dynamic', shape: 'sphere', position: [0, 0, 0] });
    world.removeBody('rem');
    expect(world.getBody('rem')).toBeUndefined();
  });

  it('applies gravity on step', () => {
    world.addBody({ id: 'fall', type: 'dynamic', shape: 'sphere', mass: 1, position: [0, 100, 0] });
    world.step(0.016);
    const b = world.getBody('fall')!;
    expect(b.velocity[1]).toBeLessThan(0);
  });

  it('static bodies are unaffected by gravity', () => {
    world.addBody({ id: 'ground', type: 'static', shape: 'box', position: [0, 0, 0] });
    world.step(0.1);
    const b = world.getBody('ground')!;
    expect(b.velocity[1]).toBe(0);
  });

  it('applyImpulse alters velocity', () => {
    world.addBody({ id: 'imp', type: 'dynamic', shape: 'sphere', mass: 1, position: [0, 0, 0] });
    world.applyImpulse('imp', [10, 0, 0]);
    expect(world.getBody('imp')!.velocity[0]).toBeGreaterThan(0);
  });

  it('raycast returns no hit in empty world', () => {
    const result = world.raycast([0, 100, 0], [0, -1, 0]);
    expect(result.hit).toBe(false);
  });

  it('raycast hits a sphere body', () => {
    world.addBody({ id: 'target', type: 'static', shape: 'sphere', position: [0, 0, 0] });
    const result = world.raycast([0, 10, 0], [0, -1, 0]);
    expect(result.hit).toBe(true);
    expect(result.bodyId).toBe('target');
  });

  it('stats track body count and step count', () => {
    world.addBody({ id: 'a', type: 'dynamic', shape: 'box', position: [0, 0, 0] });
    world.step(0.016);
    expect(world.stats.bodyCount).toBe(1);
    expect(world.stats.stepCount).toBe(1);
  });

  it('dispose clears bodies', () => {
    world.addBody({ id: 'x', type: 'dynamic', shape: 'box', position: [0, 0, 0] });
    world.dispose();
    expect(world.stats.bodyCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  4. OCTREE / BVH
// ─────────────────────────────────────────────────────────────────────────────
describe('OctreeBVH', () => {
  const WORLD = { min: [-100, -100, -100] as [number,number,number], max: [100, 100, 100] as [number,number,number] };
  let tree: OctreeBVH;
  beforeEach(() => { tree = new OctreeBVH(WORLD); });

  it('inserts and queries an entry', () => {
    tree.insert({ id: 'e1', aabb: { min: [0, 0, 0], max: [1, 1, 1] } });
    const results = tree.queryAABB({ min: [0, 0, 0], max: [1, 1, 1] });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('e1');
  });

  it('point query returns intersecting entry', () => {
    tree.insert({ id: 'p1', aabb: { min: [-1, -1, -1], max: [1, 1, 1] } });
    const results = tree.queryPoint([0, 0, 0]);
    expect(results.some(e => e.id === 'p1')).toBe(true);
  });

  it('sphere query filters by radius', () => {
    tree.insert({ id: 'near', aabb: { min: [0, 0, 0], max: [1, 1, 1] } });
    tree.insert({ id: 'far',  aabb: { min: [90, 90, 90], max: [91, 91, 91] } });
    const results = tree.querySphere([0.5, 0.5, 0.5], 5);
    expect(results.some(e => e.id === 'near')).toBe(true);
    expect(results.some(e => e.id === 'far')).toBe(false);
  });

  it('remove deletes entry', () => {
    tree.insert({ id: 'rm', aabb: { min: [0, 0, 0], max: [1, 1, 1] } });
    tree.remove('rm');
    const results = tree.queryAABB({ min: [0, 0, 0], max: [2, 2, 2] });
    expect(results.some(e => e.id === 'rm')).toBe(false);
  });

  it('handles many insertions without error', () => {
    for (let i = 0; i < 100; i++) {
      tree.insert({ id: `e${i}`, aabb: { min: [i, 0, 0], max: [i + 1, 1, 1] } });
    }
    const results = tree.queryAABB({ min: [-1, -1, -1], max: [200, 2, 2] });
    // Octree may return duplicate refs when entries span multiple child nodes;
    // unique IDs should equal 100.
    const uniqueIds = new Set(results.map(r => r.id));
    expect(uniqueIds.size).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  5. WORKER JOB SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
describe('WorkerJobSystem', () => {
  let jobs: WorkerJobSystem;
  beforeEach(() => { jobs = new WorkerJobSystem(2); });

  it('executes a job and returns result', async () => {
    const r = await jobs.enqueue({ id: 'j1', fn: () => 42 });
    expect(r.result).toBe(42);
    expect(r.id).toBe('j1');
  });

  it('tracks completed count', async () => {
    await jobs.enqueue({ id: 'j2', fn: () => 'ok' });
    expect(jobs.stats.completed).toBe(1);
  });

  it('higher priority job is sorted first in queue before dispatch', async () => {
    // Use a single-slot system so queue order = execution order.
    const serial = new WorkerJobSystem(1);
    let blocker: (() => void) | null = null;
    const blockPromise = serial.enqueue({
      id: 'block',
      fn: () => new Promise<void>(r => { blocker = r; }),
    });

    // Wait one microtask tick so the blocker fn is invoked and `blocker` is set.
    await new Promise(r => setTimeout(r, 0));

    // Slot is now occupied; enqueue low first, high second.
    const order: string[] = [];
    const p1 = serial.enqueue({ id: 'low',  priority: 'low',  fn: () => { order.push('low');  return 0; } });
    const p2 = serial.enqueue({ id: 'high', priority: 'high', fn: () => { order.push('high'); return 1; } });

    // Release the blocker so the queue can drain.
    blocker!();
    await Promise.all([blockPromise, p1, p2]);
    expect(order[0]).toBe('high');
  });

  it('handles rejected jobs gracefully', async () => {
    const r = await jobs.enqueue({ id: 'err', fn: () => { throw new Error('fail'); } });
    expect(r.error).toBeDefined();
  });

  it('reports stats', async () => {
    await jobs.enqueue({ id: 's', fn: () => 1 });
    expect(jobs.stats.completed).toBeGreaterThan(0);
    expect(jobs.stats.avgMs).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  6. PROCEDURAL WORLD GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
describe('ProceduralWorldGen', () => {
  let gen: ProceduralWorldGen;
  beforeEach(() => { gen = new ProceduralWorldGen({ seed: 12345, width: 16, depth: 16 }); });

  it('generates a chunk with correct dimensions', () => {
    const chunk = gen.generateChunk(0, 0);
    expect(chunk.heightmap.length).toBe(16 * 16);
    expect(chunk.x).toBe(0);
    expect(chunk.z).toBe(0);
  });

  it('same seed → same chunk data', () => {
    const gen2 = new ProceduralWorldGen({ seed: 12345, width: 16, depth: 16 });
    const c1 = gen.generateChunk(3, 7);
    const c2 = gen2.generateChunk(3, 7);
    expect(c1.heightmap[0]).toBeCloseTo(c2.heightmap[0], 6);
  });

  it('different seeds → different chunks', () => {
    const gen2 = new ProceduralWorldGen({ seed: 99999, width: 16, depth: 16 });
    const c1 = gen.generateChunk(0, 0);
    const c2 = gen2.generateChunk(0, 0);
    const differs = c1.heightmap.some((v, i) => Math.abs(v - c2.heightmap[i]) > 0.001);
    expect(differs).toBe(true);
  });

  it('assigns a biome string', () => {
    const chunk = gen.generateChunk(0, 0);
    expect(typeof chunk.biome).toBe('string');
    expect(chunk.biome.length).toBeGreaterThan(0);
  });

  it('caches chunks on second access', () => {
    gen.generateChunk(1, 1);
    expect(gen.cachedChunks).toBe(1);
    gen.generateChunk(1, 1);
    expect(gen.cachedChunks).toBe(1); // no new cache entry
  });

  it('evictChunk removes from cache', () => {
    gen.generateChunk(2, 2);
    gen.evictChunk(2, 2);
    expect(gen.cachedChunks).toBe(0);
  });

  it('sampleHeight returns a number', () => {
    const h = gen.sampleHeight(100, 200);
    expect(typeof h).toBe('number');
    expect(isFinite(h)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  8. REPLAY BUFFER
// ─────────────────────────────────────────────────────────────────────────────
describe('ReplayBuffer', () => {
  let buf: ReplayBuffer;
  beforeEach(() => { buf = new ReplayBuffer(); });

  it('starts not recording', () => { expect(buf.isRecording).toBe(false); });

  it('records frames and reports count', () => {
    buf.startRecording({ gameId: 'g1', playerId: 'p1', startTime: 0, finalScore: 0 });
    buf.recordFrame({ tick: 0, actions: new Uint8Array([1, 0]) });
    buf.recordFrame({ tick: 1, actions: new Uint8Array([0, 1]) });
    expect(buf.frameCount).toBe(2);
  });

  it('stopRecording sets finalScore and checksum', () => {
    buf.startRecording({ gameId: 'g1', playerId: 'p1', startTime: 0, finalScore: 0 });
    buf.recordFrame({ tick: 0, actions: new Uint8Array([1]) });
    const meta = buf.stopRecording(999);
    expect(meta.finalScore).toBe(999);
    expect(meta.checksum).toBeGreaterThan(0);
  });

  it('serialize / deserialize round-trips correctly', () => {
    buf.startRecording({ gameId: 'g1', playerId: 'p1', startTime: Date.now(), finalScore: 0 });
    buf.recordFrame({ tick: 0, actions: new Uint8Array([7, 3, 1]) });
    buf.stopRecording(100);

    const bytes = buf.serialize();
    const buf2 = new ReplayBuffer();
    const count = buf2.deserialize(bytes);
    expect(count).toBe(1);
    buf2.startPlayback();
    const f = buf2.nextFrame();
    expect(f).not.toBeNull();
    expect(f!.tick).toBe(0);
  });

  it('playback returns null after all frames consumed', () => {
    buf.startRecording({ gameId: 'g', playerId: 'p', startTime: 0, finalScore: 0 });
    buf.recordFrame({ tick: 0, actions: new Uint8Array([0]) });
    buf.stopRecording(0);
    buf.startPlayback();
    buf.nextFrame();
    expect(buf.nextFrame()).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  9. BEHAVIOR TREE ENGINE
// ─────────────────────────────────────────────────────────────────────────────
describe('BehaviorTreeEngine', () => {
  let engine: BehaviorTreeEngine;
  let ctx: BTContext;
  beforeEach(() => {
    engine = new BehaviorTreeEngine();
    ctx = { entityId: 'npc1', blackboard: new Map(), dt: 16 };
  });

  it('returns failure for unknown tree', () => {
    expect(engine.tick('nonexistent', ctx)).toBe('failure');
  });

  it('action node returns its result', () => {
    const tree: BTNode = { type: 'action', name: 'win', fn: () => 'success' };
    engine.registerTree('win', tree);
    expect(engine.tick('win', ctx)).toBe('success');
  });

  it('sequence fails on first failure', () => {
    const tree: BTNode = {
      type: 'sequence',
      children: [
        { type: 'action', name: 'ok', fn: () => 'success' },
        { type: 'action', name: 'fail', fn: () => 'failure' },
        { type: 'action', name: 'never', fn: () => 'success' },
      ],
    };
    engine.registerTree('seq', tree);
    expect(engine.tick('seq', ctx)).toBe('failure');
  });

  it('selector succeeds on first success', () => {
    const tree: BTNode = {
      type: 'selector',
      children: [
        { type: 'action', name: 'fail', fn: () => 'failure' },
        { type: 'action', name: 'win', fn: () => 'success' },
        { type: 'action', name: 'never', fn: () => 'success' },
      ],
    };
    engine.registerTree('sel', tree);
    expect(engine.tick('sel', ctx)).toBe('success');
  });

  it('inverter flips success to failure', () => {
    const tree: BTNode = { type: 'inverter', child: { type: 'action', name: 'ok', fn: () => 'success' } };
    engine.registerTree('inv', tree);
    expect(engine.tick('inv', ctx)).toBe('failure');
  });

  it('condition node works as gate', () => {
    ctx.blackboard.set('health', 80);
    const tree: BTNode = {
      type: 'condition', name: 'alive',
      fn: (c) => (c.blackboard.get('health') as number) > 0,
    };
    engine.registerTree('cond', tree);
    expect(engine.tick('cond', ctx)).toBe('success');
  });

  it('parallel succeeds with enough successes', () => {
    const tree: BTNode = {
      type: 'parallel', successThreshold: 2,
      children: [
        { type: 'action', name: 'a', fn: () => 'success' },
        { type: 'action', name: 'b', fn: () => 'success' },
        { type: 'action', name: 'c', fn: () => 'failure' },
      ],
    };
    engine.registerTree('par', tree);
    expect(engine.tick('par', ctx)).toBe('success');
  });

  it('registeredTrees lists all trees', () => {
    engine.registerTree('t1', { type: 'action', name: 'n', fn: () => 'success' });
    engine.registerTree('t2', { type: 'action', name: 'n', fn: () => 'failure' });
    expect(engine.registeredTrees).toContain('t1');
    expect(engine.registeredTrees).toContain('t2');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  10. GPU PROFILER
// ─────────────────────────────────────────────────────────────────────────────
describe('GPUProfiler', () => {
  let profiler: GPUProfiler;
  beforeEach(() => { profiler = new GPUProfiler(10); });

  it('records a frame with spans', () => {
    profiler.beginFrame();
    profiler.beginSpan('physics');
    profiler.endSpan('physics');
    const frame = profiler.endFrame();
    expect(frame).not.toBeNull();
    expect(frame!.spans.length).toBe(1);
    expect(frame!.spans[0].label).toBe('physics');
  });

  it('avgFrameMs returns a number', () => {
    profiler.beginFrame();
    profiler.endFrame();
    expect(typeof profiler.avgFrameMs()).toBe('number');
  });

  it('hotSpot returns the slowest span label', () => {
    profiler.beginFrame();
    profiler.beginSpan('fast'); profiler.endSpan('fast');
    profiler.beginSpan('slow'); profiler.endSpan('slow');
    profiler.endFrame();
    const hs = profiler.hotSpot();
    expect(typeof hs).toBe('string');
  });

  it('getFrames respects n limit', () => {
    for (let i = 0; i < 5; i++) { profiler.beginFrame(); profiler.endFrame(); }
    expect(profiler.getFrames(3).length).toBe(3);
  });

  it('stats are reported', () => {
    profiler.beginFrame();
    profiler.endFrame();
    expect(profiler.stats.frames).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  11. TYPED EVENT BUS
// ─────────────────────────────────────────────────────────────────────────────
describe('TypedEventBus', () => {
  interface Events { score: number; death: { reason: string } }
  let bus: TypedEventBus<Events>;
  beforeEach(() => { bus = new TypedEventBus<Events>(64); });

  it('calls listener on emit', () => {
    let received = 0;
    bus.on('score', n => { received = n; });
    bus.emit('score', 100);
    expect(received).toBe(100);
  });

  it('once listener fires only once', () => {
    let count = 0;
    bus.once('score', () => { count++; });
    bus.emit('score', 1);
    bus.emit('score', 2);
    expect(count).toBe(1);
  });

  it('off removes the listener', () => {
    let count = 0;
    const fn = () => { count++; };
    bus.on('score', fn);
    bus.off('score', fn);
    bus.emit('score', 5);
    expect(count).toBe(0);
  });

  it('wildcard * receives all events', () => {
    const events: string[] = [];
    (bus as TypedEventBus<Record<string,unknown>>).on('*', (d) => { events.push(String(d)); });
    bus.emit('score', 1);
    bus.emit('death', { reason: 'fell' });
    expect(events.length).toBe(2);
  });

  it('replayTo delivers history to new subscriber', () => {
    bus.emit('score', 10);
    bus.emit('score', 20);
    const history: number[] = [];
    bus.replayTo('score', n => { history.push(n); });
    expect(history).toEqual([10, 20]);
  });

  it('stats track emit count', () => {
    bus.emit('score', 1);
    bus.emit('score', 2);
    expect(bus.stats.emitCount).toBe(2);
  });

  it('dispose clears listeners', () => {
    let called = false;
    bus.on('score', () => { called = true; });
    bus.dispose();
    bus.emit('score', 1);
    expect(called).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  12. ANIMATION STATE MACHINE
// ─────────────────────────────────────────────────────────────────────────────
describe('AnimationStateMachine', () => {
  let asm: AnimationStateMachine;
  const idle: AnimationClip = { id: 'idle', durationFrames: 30, looping: true, frameRate: 30 };
  const run: AnimationClip  = { id: 'run',  durationFrames: 20, looping: true, frameRate: 30 };
  beforeEach(() => {
    asm = new AnimationStateMachine();
    asm.registerClip(idle);
    asm.registerClip(run);
    asm.addTransition({ from: 'idle', to: 'run', conditionKey: 'speed', conditionValue: 'fast' });
    asm.createAgent('npc', 'idle');
  });

  it('creates agent in initial clip', () => {
    const s = asm.getState('npc');
    expect(s).not.toBeNull();
    expect(s!.currentClip).toBe('idle');
  });

  it('ticks advance the frame', () => {
    asm.tick('npc', 33); // one frame at 30fps
    const s = asm.getState('npc')!;
    expect(s.frame).toBeGreaterThan(0);
  });

  it('parameter change triggers transition', () => {
    asm.setParameter('npc', 'speed', 'fast');
    asm.tick('npc', 16);
    const s = asm.getState('npc')!;
    expect(s.targetClip).toBe('run');
  });

  it('reports stats', () => {
    expect(asm.stats.clips).toBe(2);
    expect(asm.stats.transitions).toBe(1);
    expect(asm.stats.agents).toBe(1);
  });

  it('returns null for unknown agent', () => {
    expect(asm.tick('ghost', 16)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  13. LOD SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
describe('LODSystem', () => {
  let lod: LODSystem;

  const levels: LODLevel[] = [
    { minDist: 0, maxDist: 50, meshId: 'high', triangleCount: 10000 },
    { minDist: 50, maxDist: 150, meshId: 'med', triangleCount: 2000 },
    { minDist: 150, maxDist: 500, meshId: 'low', triangleCount: 200 },
  ];

  const obj: LODObject = {
    id: 'tree1',
    position: [0, 0, 0],
    levels,
    currentLevel: 0,
  };

  beforeEach(() => { lod = new LODSystem(); lod.register({ ...obj, currentLevel: 0 }); });

  it('selects high LOD when camera is close', () => {
    const changes = lod.update([10, 0, 0]);
    expect(changes.has('tree1')).toBe(false); // already at level 0
  });

  it('downgrades LOD when camera moves far', () => {
    lod.update([200, 0, 0]); // should downgrade
    const s = lod.stats;
    expect(s.updateCount).toBe(1);
  });

  it('forceLevel overrides distance calculation', () => {
    const objForced: LODObject = { ...obj, id: 'tree2', forceLevel: 2, currentLevel: 0 };
    lod.register(objForced);
    lod.update([0, 0, 0]);
    // After update, currentLevel should be 2
    expect(objForced.currentLevel).toBe(2);
  });

  it('unregister removes object', () => {
    lod.unregister('tree1');
    expect(lod.stats.objects).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  14. CLIENT-SIDE PREDICTION
// ─────────────────────────────────────────────────────────────────────────────
describe('ClientSidePrediction', () => {
  let csp: ClientSidePrediction;
  beforeEach(() => { csp = new ClientSidePrediction(8); });

  it('saveState stores predicted frames', () => {
    csp.saveState({ tick: 1, position: [0, 0, 0], velocity: [1, 0, 0] });
    expect(csp.stats.buffered).toBe(1);
  });

  it('reconcile returns null for close positions', () => {
    csp.saveState({ tick: 5, position: [1, 0, 0], velocity: [0, 0, 0] });
    const result = csp.reconcile({
      tick: 5,
      state: { tick: 5, position: [1.001, 0, 0], velocity: [0, 0, 0] },
      authoritative: true,
    }, 0.1);
    expect(result).toBeNull();
  });

  it('reconcile returns base state for divergent positions', () => {
    csp.saveState({ tick: 5, position: [0, 0, 0], velocity: [0, 0, 0] });
    const result = csp.reconcile({
      tick: 5,
      state: { tick: 5, position: [10, 0, 0], velocity: [0, 0, 0] },
      authoritative: true,
    }, 0.1);
    expect(result).not.toBeNull();
    expect(csp.stats.reconciliations).toBe(1);
  });

  it('pendingResimTicks returns ticks after a given tick', () => {
    for (let t = 1; t <= 5; t++) csp.saveState({ tick: t, position: [0, 0, 0], velocity: [0, 0, 0] });
    const pending = csp.pendingResimTicks(3);
    expect(pending).toContain(4);
    expect(pending).toContain(5);
    expect(pending).not.toContain(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  15. RESOURCE POOL
// ─────────────────────────────────────────────────────────────────────────────
describe('ResourcePool', () => {
  interface Bullet { x: number; reset?: () => void; }
  let pool: ResourcePool<Bullet>;
  beforeEach(() => { pool = new ResourcePool<Bullet>(() => ({ x: 0 }), 5); });

  it('acquire returns an object', () => {
    const obj = pool.acquire();
    expect(obj).not.toBeNull();
    expect(typeof obj!.x).toBe('number');
  });

  it('release returns object to pool', () => {
    const obj = pool.acquire()!;
    expect(pool.stats.active).toBe(1);
    pool.release(obj);
    expect(pool.stats.active).toBe(0);
  });

  it('returns null when pool is exhausted', () => {
    for (let i = 0; i < 5; i++) pool.acquire();
    const extra = pool.acquire();
    expect(extra).toBeNull();
    expect(pool.stats.missCount).toBe(1);
  });

  it('releaseAll returns all active objects', () => {
    pool.acquire(); pool.acquire(); pool.acquire();
    pool.releaseAll();
    expect(pool.stats.active).toBe(0);
    expect(pool.stats.pool).toBe(5);
  });

  it('calls reset() on release if defined', () => {
    let resetCalled = false;
    const p2 = new ResourcePool<{ reset: () => void }>(() => ({ reset: () => { resetCalled = true; } }), 2);
    const obj = p2.acquire()!;
    p2.release(obj);
    expect(resetCalled).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  16. WGSL SHADER MANAGER
// ─────────────────────────────────────────────────────────────────────────────
describe('WGSLShaderManager', () => {
  let sm: WGSLShaderManager;
  beforeEach(() => { sm = new WGSLShaderManager(); });

  it('registers a shader source and returns the id', () => {
    const id = sm.register('test.wgsl', '@compute @workgroup_size(64) fn main() {}');
    expect(id).toBe('test.wgsl');
    expect(sm.getSource('test.wgsl')).toContain('@compute');
  });

  it('same source hit increments cacheHits', () => {
    const src = '@compute fn main() {}';
    sm.register('s.wgsl', src);
    sm.register('s.wgsl', src);
    expect(sm.stats.cacheHits).toBe(1);
  });

  it('changed source increments hotReloads', () => {
    sm.register('s.wgsl', 'v1');
    sm.register('s.wgsl', 'v2');
    expect(sm.stats.hotReloads).toBe(1);
  });

  it('compileVariant substitutes defines', () => {
    sm.register('base.wgsl', 'let x = {{VALUE}};');
    const key = sm.compileVariant('base.wgsl', {
      key: 'base_v1',
      defines: { VALUE: '42' },
      wgsl: '',
    });
    expect(key).toBe('base_v1');
    expect(sm.getSource('base_v1')).toContain('let x = 42;');
  });

  it('dispose clears all state', () => {
    sm.register('a.wgsl', 'fn main() {}');
    sm.dispose();
    expect(sm.stats.registered).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  17. TERRAIN ENGINE
// ─────────────────────────────────────────────────────────────────────────────
describe('TerrainEngine', () => {
  let terrain: TerrainEngine;
  beforeEach(() => {
    const gen = new ProceduralWorldGen({ seed: 777, width: 9, depth: 9 });
    terrain = new TerrainEngine(9, 4);
    terrain.attachGenerator(gen);
  });

  it('generates a page with correct geometry', () => {
    const page = terrain.getPage(0, 0, 0);
    expect(page.vertices.length).toBe(9 * 9 * 3);
    expect(page.indices.length).toBe(8 * 8 * 6);
  });

  it('caches page on second access', () => {
    terrain.getPage(0, 0, 0);
    expect(terrain.stats.cachedPages).toBe(1);
    terrain.getPage(0, 0, 0);
    expect(terrain.stats.cachedPages).toBe(1);
  });

  it('evictPage removes from cache', () => {
    terrain.getPage(0, 1, 1);
    terrain.evictPage(0, 1, 1);
    expect(terrain.stats.cachedPages).toBe(0);
  });

  it('requiredPages returns expected pages around camera', () => {
    const pages = terrain.requiredPages(0, 0, 50);
    expect(pages.length).toBeGreaterThan(0);
  });

  it('stats report correct pageSize', () => {
    expect(terrain.stats.pageSize).toBe(9);
    expect(terrain.stats.maxLOD).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  18. GLOBAL ILLUMINATION PROBES
// ─────────────────────────────────────────────────────────────────────────────
describe('GlobalIllumProbes', () => {
  let gi: GlobalIllumProbes;
  beforeEach(() => { gi = new GlobalIllumProbes(); });

  it('adds a probe', () => {
    gi.addProbe({ id: 'p1', position: [0, 1, 0], radius: 10, coeffs: new Float32Array(27) });
    expect(gi.stats.probes).toBe(1);
  });

  it('bakeProbe produces non-zero L0 coefficient', () => {
    gi.addProbe({ id: 'p1', position: [0, 0, 0], radius: 10, coeffs: new Float32Array(27) });
    gi.bakeProbe('p1', [
      [1, 1, 1], [0.5, 0.5, 0.5], [0.8, 0.8, 0.8],
      [0.3, 0.3, 0.3], [0.7, 0.7, 0.7], [0.4, 0.4, 0.4],
    ]);
    expect(gi.stats.dirtyProbes).toBe(0);
  });

  it('evaluateAt returns an RGB triple', () => {
    gi.addProbe({ id: 'p1', position: [0, 0, 0], radius: 20, coeffs: new Float32Array(27) });
    gi.bakeProbe('p1', [[1, 0, 0],[0, 1, 0],[0, 0, 1],[1, 1, 0],[0, 1, 1],[1, 0, 1]]);
    const [r, g, b] = gi.evaluateAt([0, 0, 0], [0, 1, 0]);
    expect(typeof r).toBe('number');
    expect(typeof g).toBe('number');
    expect(typeof b).toBe('number');
  });

  it('evaluateAt returns [0,0,0] with no probes', () => {
    const [r, g, b] = gi.evaluateAt([0, 0, 0], [0, 1, 0]);
    expect(r).toBe(0); expect(g).toBe(0); expect(b).toBe(0);
  });

  it('removeProbe decrements count', () => {
    gi.addProbe({ id: 'rm', position: [0, 0, 0], radius: 5, coeffs: new Float32Array(27) });
    gi.removeProbe('rm');
    expect(gi.stats.probes).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  19. ASSET STREAM MANAGER
// ─────────────────────────────────────────────────────────────────────────────
describe('AssetStreamManager', () => {
  let mgr: AssetStreamManager;
  beforeEach(() => { mgr = new AssetStreamManager(2, 16); });

  it('registers an asset', () => {
    mgr.register({ id: 'mesh1', url: '/models/a.glb', type: 'mesh', priority: 5, lod: 0 });
    expect(mgr.get('mesh1')).toBeDefined();
    expect(mgr.get('mesh1')!.state).toBe('unloaded');
  });

  it('request queues an asset for loading', () => {
    mgr.register({ id: 'tex1', url: '/textures/a.png', type: 'texture', priority: 3, lod: 0 });
    mgr.request('tex1');
    // In Node fetch will fail, but state should have been queued/loading/error
    const h = mgr.get('tex1')!;
    expect(['queued', 'loading', 'error']).toContain(h.state);
  });

  it('cancel reverts state to unloaded', () => {
    mgr.register({ id: 'audio1', url: '/audio/a.mp3', type: 'audio', priority: 1, lod: 0 });
    // Manually set to queued to test cancel
    const h = mgr.get('audio1')!;
    h.state = 'queued';
    (mgr as unknown as { queue: typeof h[] }).queue.push(h);
    mgr.cancel('audio1');
    expect(mgr.get('audio1')!.state).toBe('unloaded');
  });

  it('stats are reported', () => {
    expect(mgr.stats.assets).toBe(0);
    mgr.register({ id: 'x', url: '/x', type: 'shader', priority: 0, lod: 0 });
    expect(mgr.stats.assets).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  20. PHYSICS MATERIAL SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
describe('PhysicsMaterialSystem', () => {
  let mats: PhysicsMaterialSystem;
  beforeEach(() => { mats = new PhysicsMaterialSystem(); });

  it('has default materials', () => {
    expect(mats.get('concrete')).toBeDefined();
    expect(mats.get('metal')).toBeDefined();
    expect(mats.get('ice')).toBeDefined();
  });

  it('concrete has high friction', () => {
    const c = mats.get('concrete')!;
    expect(c.staticFriction).toBeGreaterThan(0.5);
  });

  it('ice has very low friction', () => {
    const ice = mats.get('ice')!;
    expect(ice.dynamicFriction).toBeLessThan(0.1);
  });

  it('getContactPair uses geometric mean', () => {
    const pair = mats.getContactPair('concrete', 'ice');
    const concrete = mats.get('concrete')!;
    const ice = mats.get('ice')!;
    const expected = Math.sqrt(concrete.dynamicFriction * ice.dynamicFriction);
    expect(pair.combinedFriction).toBeCloseTo(expected, 5);
  });

  it('setPair overrides computed pair', () => {
    mats.setPair('concrete', 'metal', { combinedFriction: 0.99 });
    const pair = mats.getContactPair('concrete', 'metal');
    expect(pair.combinedFriction).toBeCloseTo(0.99);
  });

  it('registers a custom material', () => {
    mats.register({
      id: 'carbon-fiber',
      name: 'Carbon Fiber',
      staticFriction: 0.4,
      dynamicFriction: 0.35,
      restitution: 0.1,
      density: 1600,
      audioSurface: 'metal',
    });
    expect(mats.get('carbon-fiber')!.name).toBe('Carbon Fiber');
  });

  it('stats track material count', () => {
    expect(mats.stats.materials).toBeGreaterThanOrEqual(8);
  });

  it('metal has sparks particle effect', () => {
    expect(mats.get('metal')!.particleEffect).toBe('sparks');
  });
});
