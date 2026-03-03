// tests/engine-v2.test.ts
// Unit tests for all EngineCore v2 modules.

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Phase 1 — Instrumentation
// ---------------------------------------------------------------------------
import {
  EngineEventLog,
  SubstepCounter,
  EntityCounters,
  computeHeatScore,
  checkBudgets,
  DEFAULT_BUDGETS,
  zeroTimers,
  Stopwatch,
} from '@/lib/engine-v2/instrumentation';

describe('EngineEventLog (ring buffer)', () => {
  it('stores events and returns recent', () => {
    const log = new EngineEventLog();
    log.push({ tick: 1, level: 'info', system: 'physics', message: 'step' });
    log.push({ tick: 2, level: 'warn', system: 'render', message: 'slow' });
    const events = log.recent(5);
    expect(events).toHaveLength(2);
    expect(events[0].tick).toBe(1);
    expect(events[1].tick).toBe(2);
  });

  it('wraps around after capacity (256)', () => {
    const log = new EngineEventLog();
    for (let i = 0; i < 300; i++) {
      log.push({ tick: i, level: 'info', system: 'test', message: `${i}` });
    }
    expect(log.size).toBe(256);
    const recent = log.recent(3);
    expect(recent[2].tick).toBe(299);
  });

  it('clears correctly', () => {
    const log = new EngineEventLog();
    log.push({ tick: 1, level: 'info', system: 'x', message: 'y' });
    log.clear();
    expect(log.size).toBe(0);
    expect(log.recent()).toHaveLength(0);
  });
});

describe('SubstepCounter', () => {
  it('counts and resets', () => {
    const c = new SubstepCounter();
    c.increment();
    c.increment();
    c.increment();
    expect(c.readAndReset()).toBe(3);
    expect(c.readAndReset()).toBe(0);
  });
});

describe('EntityCounters', () => {
  it('increments and snapshots', () => {
    const ec = new EntityCounters();
    ec.set('RigidBody', 10);
    ec.increment('Sprite');
    ec.increment('Sprite');
    const snap = ec.snapshot();
    expect(snap['RigidBody']).toBe(10);
    expect(snap['Sprite']).toBe(2);
  });

  it('decrements and clamps to 0', () => {
    const ec = new EntityCounters();
    ec.set('X', 1);
    ec.decrement('X');
    ec.decrement('X'); // should not go negative
    expect(ec.snapshot()['X']).toBe(0);
  });
});

describe('computeHeatScore', () => {
  it('returns 0 when no load', () => {
    const score = computeHeatScore({
      physicsMs: 0, renderMs: 0, drawCalls: 0,
      heapBytes: 0, prevHeapBytes: 0,
      frameBudgetMs: 16.67, maxDrawCalls: 100, maxHeapBytes: 256_000_000,
    });
    expect(score).toBe(0);
  });

  it('returns ~1 when severely overloaded', () => {
    const score = computeHeatScore({
      physicsMs: 100, renderMs: 100, drawCalls: 1000,
      heapBytes: 500_000_000, prevHeapBytes: 400_000_000,
      frameBudgetMs: 16.67, maxDrawCalls: 100, maxHeapBytes: 256_000_000,
    });
    expect(score).toBeGreaterThanOrEqual(0.9);
    expect(score).toBeLessThanOrEqual(1.0);
  });
});

describe('checkBudgets', () => {
  it('returns no breaches within budget', () => {
    const breaches = checkBudgets(
      { physicsMs: 2, inputMs: 0.5, renderMs: 5, gcPressure: 0 },
      100, 8, 500,
    );
    expect(breaches).toHaveLength(0);
  });

  it('detects physicsMs breach', () => {
    const breaches = checkBudgets(
      { physicsMs: 10, inputMs: 0, renderMs: 1, gcPressure: 0 },
      0, 0, 0,
    );
    expect(breaches.some(b => b.metric === 'physicsMs')).toBe(true);
  });

  it('detects entity count breach', () => {
    const breaches = checkBudgets(zeroTimers(), 0, 0, 2000);
    expect(breaches.some(b => b.metric === 'entityCount')).toBe(true);
  });
});

describe('Stopwatch', () => {
  it('returns a positive elapsed time', () => {
    const sw = new Stopwatch();
    sw.start();
    const elapsed = sw.stop();
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Phase 2 — Determinism
// ---------------------------------------------------------------------------
import {
  mulberry32,
  fpSafe, fpClamp, fpZeroFlush,
  computeStateHash, buildHashData,
  normalisePair, sortPairs,
  DeterministicInputQueue,
  ReplayRecorder, ReplayPlayer,
  computeDelta, CheckpointManager,
} from '@/lib/engine-v2/determinism';

describe('mulberry32 RNG', () => {
  it('is deterministic with same seed', () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(42);
    const seq1 = [r1(), r1(), r1()];
    const seq2 = [r2(), r2(), r2()];
    expect(seq1).toEqual(seq2);
  });

  it('produces values in [0,1)', () => {
    const r = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('floating-point discipline', () => {
  it('clamps Infinity to FP_MAX', () => {
    expect(isFinite(fpClamp(Infinity))).toBe(true);
    expect(isFinite(fpClamp(-Infinity))).toBe(true);
  });

  it('flushes near-zero values to 0', () => {
    expect(fpZeroFlush(1e-11)).toBe(0);
    expect(fpZeroFlush(0.1)).toBe(0.1);
  });

  it('fpSafe handles NaN', () => {
    expect(fpSafe(NaN)).toBe(0);
  });
});

describe('computeStateHash', () => {
  it('is stable for the same input', () => {
    const data = new Float32Array([1.0, 2.0, 3.0, 4.0]);
    expect(computeStateHash(data)).toBe(computeStateHash(data));
  });

  it('differs for different inputs', () => {
    const a = new Float32Array([1.0, 2.0]);
    const b = new Float32Array([1.0, 3.0]);
    expect(computeStateHash(a)).not.toBe(computeStateHash(b));
  });
});

describe('buildHashData + computeStateHash (replay determinism)', () => {
  it('produces identical hash for identical body states', () => {
    const bodies = [
      { x: 1, y: 2, vx: 0.5, vy: -0.5 },
      { x: 10, y: 20, vx: 0, vy: 0 },
    ];
    const h1 = computeStateHash(buildHashData(bodies));
    const h2 = computeStateHash(buildHashData(bodies));
    expect(h1).toBe(h2);
  });
});

describe('normalisePair + sortPairs', () => {
  it('normalises so a <= b', () => {
    const p = normalisePair(5, 2);
    expect(p.a).toBe(2);
    expect(p.b).toBe(5);
  });

  it('sorts pairs deterministically', () => {
    const pairs = [normalisePair(3, 7), normalisePair(1, 2), normalisePair(3, 4)];
    const sorted = sortPairs(pairs);
    expect(sorted[0]).toEqual({ a: 1, b: 2 });
    expect(sorted[1]).toEqual({ a: 3, b: 4 });
    expect(sorted[2]).toEqual({ a: 3, b: 7 });
  });
});

describe('DeterministicInputQueue', () => {
  it('drains only events at or before current tick', () => {
    const q = new DeterministicInputQueue();
    q.enqueue({ tick: 5, entityId: 1, action: 'jump', value: 1 });
    q.enqueue({ tick: 10, entityId: 1, action: 'move', value: 0.5 });
    q.enqueue({ tick: 3, entityId: 2, action: 'fire', value: 1 });

    const drained = q.drainForTick(6);
    expect(drained).toHaveLength(2);
    expect(drained.map(e => e.tick)).toEqual([3, 5]);
    expect(q.length).toBe(1);
  });
});

describe('ReplayRecorder + ReplayPlayer', () => {
  it('records and replays same hashes', () => {
    const recorder = new ReplayRecorder();
    const initial = { tick: 0, bodies: [], stateHash: 0 };
    recorder.begin(42, initial);
    recorder.recordHash(1, 1111);
    recorder.recordHash(2, 2222);
    recorder.recordHash(3, 3333);
    const record = recorder.finish();

    const newHashes = new Map([[1, 1111], [2, 2222], [3, 3333]]);
    const player = new ReplayPlayer();
    const result = player.compare(record, newHashes);
    expect(result.passed).toBe(true);
    expect(result.divergedTicks).toHaveLength(0);
  });

  it('detects hash divergence', () => {
    const recorder = new ReplayRecorder();
    recorder.begin(42, { tick: 0, bodies: [], stateHash: 0 });
    recorder.recordHash(1, 1111);
    recorder.recordHash(2, 2222);
    const record = recorder.finish();

    const badHashes = new Map([[1, 1111], [2, 9999]]);
    const player = new ReplayPlayer();
    const result = player.compare(record, badHashes);
    expect(result.passed).toBe(false);
    expect(result.divergedTicks).toContain(2);
  });
});

describe('computeDelta', () => {
  it('returns only changed bodies', () => {
    const prev = {
      tick: 0,
      bodies: [
        { id: 1, x: 0, y: 0, vx: 0, vy: 0, angle: 0, angularVel: 0 },
        { id: 2, x: 5, y: 5, vx: 0, vy: 0, angle: 0, angularVel: 0 },
      ],
      stateHash: 0,
    };
    const next = {
      tick: 1,
      bodies: [
        { id: 1, x: 1, y: 0, vx: 0.5, vy: 0, angle: 0, angularVel: 0 }, // changed
        { id: 2, x: 5, y: 5, vx: 0, vy: 0, angle: 0, angularVel: 0 },   // unchanged
      ],
      stateHash: 0,
    };
    const delta = computeDelta(prev, next);
    expect(delta.changed).toHaveLength(1);
    expect(delta.changed[0].id).toBe(1);
  });
});

describe('CheckpointManager', () => {
  it('saves and retrieves last checkpoint', () => {
    const cm = new CheckpointManager();
    const snap = { tick: 10, bodies: [], stateHash: 42 };
    cm.save(snap);
    expect(cm.lastCheckpoint()?.tick).toBe(10);
  });

  it('returns null when no checkpoint saved', () => {
    const cm = new CheckpointManager();
    expect(cm.lastCheckpoint()).toBeNull();
  });

  it('evicts oldest when over maxCheckpoints', () => {
    const cm = new CheckpointManager(3);
    for (let i = 0; i < 5; i++) {
      cm.save({ tick: i, bodies: [], stateHash: i });
    }
    // Should keep last 3: ticks 2,3,4
    expect(cm.lastCheckpoint()?.tick).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Phase 3 — Physics v2
// ---------------------------------------------------------------------------
import {
  mixFriction, mixRestitution, clampPenetration,
  IslandSleepManager, getSolverPreset,
  solveXPBDDistance, sweptAABBTimeOfImpact,
  type Body,
} from '@/lib/engine-v2/physics-v2';

function makeBody(id: number, overrides: Partial<Body> = {}): Body {
  return {
    id, x: 0, y: 0, vx: 0, vy: 0, angle: 0, angularVel: 0,
    invMass: 1, invInertia: 1, restitution: 0.3, friction: 0.5,
    ccd: false, sleepTimer: 0, sleeping: false,
    ...overrides,
  };
}

describe('friction / restitution mixing', () => {
  it('mixFriction is sqrt(a*b)', () => {
    expect(mixFriction(0.25, 0.64)).toBeCloseTo(Math.sqrt(0.16), 5);
  });

  it('mixRestitution is max(a,b)', () => {
    expect(mixRestitution(0.3, 0.7)).toBe(0.7);
  });
});

describe('clampPenetration', () => {
  it('clamps values above 0.5', () => {
    expect(clampPenetration(2)).toBe(0.5);
    expect(clampPenetration(0.3)).toBe(0.3);
  });
});

describe('getSolverPreset', () => {
  it('returns correct iterations for mobile-safe', () => {
    const cfg = getSolverPreset('mobile-safe');
    expect(cfg.iterations).toBe(4);
    expect(cfg.mode).toBe('sequential-impulse');
  });

  it('returns more iterations for accurate', () => {
    const accurate = getSolverPreset('accurate');
    const mobileSafe = getSolverPreset('mobile-safe');
    expect(accurate.iterations).toBeGreaterThan(mobileSafe.iterations);
  });
});

describe('IslandSleepManager', () => {
  it('puts an entire island to sleep after threshold', () => {
    const mgr = new IslandSleepManager({ linearThreshold: 0.01, angularThreshold: 0.01, timeToSleep: 0.5 });
    const bodyA = makeBody(1, { vx: 0, vy: 0 });
    const bodyB = makeBody(2, { vx: 0, vy: 0 });
    const island = [bodyA, bodyB];

    // Simulate 0.6s of stillness
    for (let t = 0; t < 6; t++) {
      mgr.updateIslands([island], 0.1);
    }

    expect(bodyA.sleeping).toBe(true);
    expect(bodyB.sleeping).toBe(true);
  });

  it('does not sleep if any body is moving', () => {
    const mgr = new IslandSleepManager({ linearThreshold: 0.01, angularThreshold: 0.01, timeToSleep: 0.5 });
    const bodyA = makeBody(1, { vx: 0, vy: 0 });
    const bodyB = makeBody(2, { vx: 5, vy: 0 }); // moving

    const island = [bodyA, bodyB];
    mgr.updateIslands([island], 0.6);

    expect(bodyA.sleeping).toBe(false);
    expect(bodyB.sleeping).toBe(false);
  });
});

describe('solveXPBDDistance', () => {
  it('moves bodies toward rest length', () => {
    const bA = makeBody(1, { x: 0, y: 0 });
    const bB = makeBody(2, { x: 10, y: 0 });
    const constraint = { bodyA: 1, bodyB: 2, restLength: 5, compliance: 0 };
    const before = bB.x - bA.x;

    solveXPBDDistance(bA, bB, constraint, 1 / 60);

    const after = bB.x - bA.x;
    expect(Math.abs(after)).toBeLessThan(Math.abs(before));
  });
});

describe('sweptAABBTimeOfImpact', () => {
  it('returns t < 1 when A sweeps into B', () => {
    // A at x=0..1, moving right. B at x=3..4.
    const t = sweptAABBTimeOfImpact(0, 1, 0, 1, 3, 4, 0, 1, 3, 0);
    expect(t).toBeLessThan(1);
    expect(t).toBeGreaterThanOrEqual(0);
  });

  it('returns 1 when no overlap possible', () => {
    // A moving left, B is to the right — no impact
    const t = sweptAABBTimeOfImpact(0, 1, 0, 1, 5, 6, 0, 1, -3, 0);
    expect(t).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Phase 4 — Broadphase v2
// ---------------------------------------------------------------------------
import {
  fattenAABB, aabbOverlaps,
  filtersCollide, CollisionLayers,
  PairCache,
  UniformGridBroadphase, computeOptimalCellSize,
  overlapCircle, raycast, nearest,
  newQueryBudget, canQuery, consumeQuery, resetQueryBudget,
} from '@/lib/engine-v2/broadphase-v2';

const DEFAULT_FILTER = { layer: CollisionLayers.DEFAULT, mask: CollisionLayers.DEFAULT };

describe('fattenAABB', () => {
  it('expands AABB by factor', () => {
    const aabb = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const fat = fattenAABB(aabb, 0.1);
    expect(fat.minX).toBeLessThan(0);
    expect(fat.maxX).toBeGreaterThan(10);
  });
});

describe('aabbOverlaps', () => {
  it('detects overlap', () => {
    const a = { minX: 0, minY: 0, maxX: 5, maxY: 5 };
    const b = { minX: 3, minY: 3, maxX: 8, maxY: 8 };
    expect(aabbOverlaps(a, b)).toBe(true);
  });

  it('detects non-overlap', () => {
    const a = { minX: 0, minY: 0, maxX: 2, maxY: 2 };
    const b = { minX: 5, minY: 5, maxX: 8, maxY: 8 };
    expect(aabbOverlaps(a, b)).toBe(false);
  });
});

describe('filtersCollide', () => {
  it('allows default vs default', () => {
    expect(filtersCollide(DEFAULT_FILTER, DEFAULT_FILTER)).toBe(true);
  });

  it('blocks player vs enemy when masks exclude', () => {
    const player = { layer: CollisionLayers.PLAYER, mask: CollisionLayers.WALL };
    const enemy  = { layer: CollisionLayers.ENEMY,  mask: CollisionLayers.WALL };
    expect(filtersCollide(player, enemy)).toBe(false);
  });
});

describe('PairCache', () => {
  it('tracks pairs and residual scores', () => {
    const cache = new PairCache(100);
    cache.touch(1, 2, 0);
    cache.touch(1, 2, 1);
    expect(cache.has(1, 2)).toBe(true);
    expect(cache.has(2, 1)).toBe(true); // normalised
    const pair = cache.get(1, 2);
    expect(pair?.residualScore).toBe(2);
  });

  it('evicts stale pairs', () => {
    const cache = new PairCache(100);
    cache.touch(1, 2, 0);
    cache.evictStale(10, 5); // maxAge=5, last seen at 0
    expect(cache.has(1, 2)).toBe(false);
  });

  it('does not exceed capacity', () => {
    const cache = new PairCache(3);
    cache.touch(1, 2, 0);
    cache.touch(3, 4, 1);
    cache.touch(5, 6, 2);
    cache.touch(7, 8, 3); // should evict oldest
    expect(cache.size).toBe(3);
  });
});

describe('computeOptimalCellSize', () => {
  it('returns 64 for empty scene', () => {
    expect(computeOptimalCellSize([])).toBe(64);
  });

  it('returns 2x median size', () => {
    const bodies = [
      { id: 1, aabb: { minX: 0, minY: 0, maxX: 10, maxY: 10 }, filter: DEFAULT_FILTER, sleeping: false },
      { id: 2, aabb: { minX: 0, minY: 0, maxX: 20, maxY: 20 }, filter: DEFAULT_FILTER, sleeping: false },
      { id: 3, aabb: { minX: 0, minY: 0, maxX: 30, maxY: 30 }, filter: DEFAULT_FILTER, sleeping: false },
    ];
    const size = computeOptimalCellSize(bodies);
    // Median size = 20, so cellSize = 40
    expect(size).toBe(40);
  });
});

describe('UniformGridBroadphase', () => {
  it('generates a pair for two overlapping bodies', () => {
    const bp = new UniformGridBroadphase();
    bp.setCellSize(64);
    const bodies = [
      { id: 1, aabb: { minX: 0, minY: 0, maxX: 10, maxY: 10 }, filter: DEFAULT_FILTER, sleeping: false },
      { id: 2, aabb: { minX: 5, minY: 5, maxX: 15, maxY: 15 }, filter: DEFAULT_FILTER, sleeping: false },
    ];
    bp.build(bodies);
    const pairs = bp.queryPairs(bodies);
    expect(pairs.some(p => (p.a === 1 && p.b === 2) || (p.a === 2 && p.b === 1))).toBe(true);
  });

  it('does not pair sleeping bodies', () => {
    const bp = new UniformGridBroadphase();
    bp.setCellSize(64);
    const bodies = [
      { id: 1, aabb: { minX: 0, minY: 0, maxX: 10, maxY: 10 }, filter: DEFAULT_FILTER, sleeping: true },
      { id: 2, aabb: { minX: 5, minY: 5, maxX: 15, maxY: 15 }, filter: DEFAULT_FILTER, sleeping: true },
    ];
    bp.build(bodies);
    const pairs = bp.queryPairs(bodies);
    expect(pairs).toHaveLength(0);
  });
});

describe('spatial queries', () => {
  const bodies = [
    { id: 1, aabb: { minX:  0, minY:  0, maxX: 10, maxY: 10 }, filter: DEFAULT_FILTER, sleeping: false },
    { id: 2, aabb: { minX: 20, minY: 20, maxX: 30, maxY: 30 }, filter: DEFAULT_FILTER, sleeping: false },
    { id: 3, aabb: { minX: 50, minY: 50, maxX: 60, maxY: 60 }, filter: DEFAULT_FILTER, sleeping: false },
  ];

  it('overlapCircle finds nearby bodies', () => {
    const hits = overlapCircle(bodies, 5, 5, 15);
    expect(hits.some(b => b.id === 1)).toBe(true);
    expect(hits.some(b => b.id === 3)).toBe(false);
  });

  it('raycast finds intersected bodies in order', () => {
    const hits = raycast(bodies, -10, 5, 1, 0, 200);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].body.id).toBe(1);
  });

  it('nearest returns closest body', () => {
    const n = nearest(bodies, 5, 5);
    expect(n?.id).toBe(1);
  });
});

describe('SpatialQueryBudget', () => {
  it('blocks queries when over budget', () => {
    const budget = newQueryBudget(2);
    expect(canQuery(budget)).toBe(true);
    consumeQuery(budget);
    consumeQuery(budget);
    expect(canQuery(budget)).toBe(false);
    resetQueryBudget(budget);
    expect(canQuery(budget)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Phase 5 — Gameplay
// ---------------------------------------------------------------------------
import {
  EntityStateMachine, zeroIntent,
  AbilityState, EventBus,
  isTriggerActivated, findAllWithTagInRadius,
  applyDamage, isAlive, DeterministicRNGRegistry,
} from '@/lib/engine-v2/gameplay';

describe('EntityStateMachine', () => {
  it('transitions when rule exists', () => {
    const sm = new EntityStateMachine('idle', [
      { from: 'idle', to: 'move' },
      { from: 'move', to: 'idle' },
    ]);
    expect(sm.transition('move')).toBe(true);
    expect(sm.state).toBe('move');
  });

  it('refuses illegal transitions', () => {
    const sm = new EntityStateMachine('idle', [
      { from: 'idle', to: 'move' },
    ]);
    expect(sm.transition('stunned')).toBe(false);
    expect(sm.state).toBe('idle');
  });

  it('respects guards', () => {
    let guardOk = false;
    const sm = new EntityStateMachine('idle', [
      { from: 'idle', to: 'interact', guard: () => guardOk },
    ]);
    expect(sm.transition('interact')).toBe(false);
    guardOk = true;
    expect(sm.transition('interact')).toBe(true);
  });
});

describe('zeroIntent', () => {
  it('initialises all fields to zero/false/null', () => {
    const intent = zeroIntent(99);
    expect(intent.entityId).toBe(99);
    expect(intent.moveX).toBe(0);
    expect(intent.jump).toBe(false);
    expect(intent.abilityName).toBeNull();
  });
});

describe('AbilityState', () => {
  it('activates when ready and enough resource', () => {
    const ability = new AbilityState({ name: 'dash', cooldownMs: 1000, cost: 10, animHook: 'dash' });
    expect(ability.tryActivate(0, 20)).toBe(true);
    expect(ability.tryActivate(500, 20)).toBe(false); // cooldown
    expect(ability.tryActivate(1001, 20)).toBe(true);  // ready again
  });

  it('fails when not enough resource', () => {
    const ability = new AbilityState({ name: 'dash', cooldownMs: 0, cost: 50, animHook: 'dash' });
    expect(ability.tryActivate(0, 10)).toBe(false);
  });

  it('reports remaining cooldown', () => {
    const ability = new AbilityState({ name: 'dash', cooldownMs: 1000, cost: 0, animHook: 'dash' });
    ability.tryActivate(0, 0);
    expect(ability.remainingCooldownMs(500)).toBeCloseTo(500, 0);
  });
});

describe('EventBus', () => {
  it('emits and drains events', () => {
    const bus = new EventBus();
    bus.emit({ type: 'entered', entityA: 1, entityB: 2, tick: 1 });
    bus.emit({ type: 'stayed',  entityA: 1, entityB: 2, tick: 2 });
    const events = bus.drain();
    expect(events).toHaveLength(2);
    expect(bus.size).toBe(0);
  });
});

describe('isTriggerActivated', () => {
  const trigger = { id: 1, x: 0, y: 0, width: 10, height: 10, activatorTags: ['player'] };

  it('activates when inside and tag matches', () => {
    expect(isTriggerActivated(trigger, 5, 5, ['player'])).toBe(true);
  });

  it('does not activate when outside', () => {
    expect(isTriggerActivated(trigger, 20, 20, ['player'])).toBe(false);
  });

  it('does not activate when tag does not match', () => {
    expect(isTriggerActivated(trigger, 5, 5, ['enemy'])).toBe(false);
  });
});

describe('findAllWithTagInRadius', () => {
  const entities = [
    { id: 1, tags: ['player'], x: 0, y: 0 },
    { id: 2, tags: ['enemy'],  x: 5, y: 0 },
    { id: 3, tags: ['player'], x: 100, y: 0 },
  ];

  it('returns only tagged entities within radius', () => {
    const result = findAllWithTagInRadius(entities, 'player', 0, 0, 10);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});

describe('health component', () => {
  it('applies damage', () => {
    const h = { entityId: 1, hp: 100, maxHp: 100, invincibleUntilMs: 0 };
    const h2 = applyDamage(h, 30, 1000);
    expect(h2.hp).toBe(70);
    expect(isAlive(h2)).toBe(true);
  });

  it('respects invincibility window', () => {
    const h = { entityId: 1, hp: 100, maxHp: 100, invincibleUntilMs: 2000 };
    const h2 = applyDamage(h, 30, 1000); // nowMs < invincibleUntilMs
    expect(h2.hp).toBe(100);
  });

  it('hp does not go below 0', () => {
    const h = { entityId: 1, hp: 10, maxHp: 100, invincibleUntilMs: 0 };
    const h2 = applyDamage(h, 9999, 0);
    expect(h2.hp).toBe(0);
    expect(isAlive(h2)).toBe(false);
  });
});

describe('DeterministicRNGRegistry', () => {
  it('produces same sequence for same seed', () => {
    const reg1 = new DeterministicRNGRegistry();
    const reg2 = new DeterministicRNGRegistry();
    reg1.register('loot', 7);
    reg2.register('loot', 7);
    expect(reg1.next('loot')).toEqual(reg2.next('loot'));
  });
});

// ---------------------------------------------------------------------------
// Phase 6 — Render v2
// ---------------------------------------------------------------------------
import {
  VISUAL_PRESETS,
  DynamicResolutionScaler,
  activateBurst, tickBurst, effectiveRenderScale, newBurstModeState,
  computeLOD, RenderOnDemand, buildInstancedMesh, shouldFreeze,
} from '@/lib/engine-v2/render-v2';

describe('VISUAL_PRESETS', () => {
  it('Premium has renderScale 1.0', () => {
    expect(VISUAL_PRESETS.Premium.renderScale).toBe(1.0);
  });

  it('Minimal has lower scale than Premium', () => {
    expect(VISUAL_PRESETS.Minimal.renderScale).toBeLessThan(VISUAL_PRESETS.Premium.renderScale);
  });

  it('all presets have postEffectsEnabled = false (safe default)', () => {
    for (const preset of Object.values(VISUAL_PRESETS)) {
      expect(preset.postEffectsEnabled).toBe(false);
    }
  });
});

describe('DynamicResolutionScaler', () => {
  it('reduces scale when hot', () => {
    const scaler = new DynamicResolutionScaler(1.0);
    scaler.update(0.9); // above threshold
    expect(scaler.scale).toBeLessThan(1.0);
  });

  it('increases scale when cool', () => {
    const scaler = new DynamicResolutionScaler(0.5);
    scaler.update(0.3); // below recovery threshold
    expect(scaler.scale).toBeGreaterThan(0.5);
  });

  it('does not exceed maxScale', () => {
    const scaler = new DynamicResolutionScaler(1.0);
    for (let i = 0; i < 10; i++) scaler.update(0.1);
    expect(scaler.scale).toBeLessThanOrEqual(1.0);
  });
});

describe('burst mode', () => {
  it('is active immediately after activation', () => {
    let state = newBurstModeState(1.0);
    state = activateBurst(state, 0, 1500);
    expect(state.active).toBe(true);
  });

  it('expires after duration', () => {
    let state = newBurstModeState(1.0);
    state = activateBurst(state, 0, 1500);
    state = tickBurst(state, 2000);
    expect(state.active).toBe(false);
  });

  it('effectiveRenderScale returns burst scale when active', () => {
    let state = newBurstModeState(1.0);
    state = activateBurst(state, 0, 1500);
    expect(effectiveRenderScale(state, 0.5)).toBe(1.0);
  });
});

describe('computeLOD', () => {
  it('returns full for nearby objects', () => {
    expect(computeLOD(10, 1000)).toBe('full');
  });

  it('returns reduced for mid-range', () => {
    expect(computeLOD(600, 1000)).toBe('reduced');
  });

  it('returns hidden for far objects', () => {
    expect(computeLOD(1100, 1000)).toBe('hidden');
  });
});

describe('RenderOnDemand', () => {
  it('fires render only when dirty', () => {
    const rod = new RenderOnDemand();
    expect(rod.shouldRender()).toBe(true); // initially dirty
    expect(rod.shouldRender()).toBe(false); // clean now
    rod.markDirty('physics step');
    expect(rod.shouldRender()).toBe(true);
    expect(rod.shouldRender()).toBe(false);
  });
});

describe('buildInstancedMesh', () => {
  it('packs transforms correctly', () => {
    const entities = [
      { x: 1, y: 2, scaleX: 1, scaleY: 1, rotation: 0 },
      { x: 5, y: 6, scaleX: 2, scaleY: 2, rotation: 0.5 },
    ];
    const desc = buildInstancedMesh('tree', entities);
    expect(desc.count).toBe(2);
    expect(desc.transforms[0]).toBe(1);  // x of entity 0
    expect(desc.transforms[5]).toBe(5);  // x of entity 1
  });
});

describe('shouldFreeze', () => {
  it('freezes sleeping bodies', () => {
    expect(shouldFreeze(true, false)).toBe(true);
  });

  it('freezes static bodies', () => {
    expect(shouldFreeze(false, true)).toBe(true);
  });

  it('does not freeze active dynamic bodies', () => {
    expect(shouldFreeze(false, false)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Phase 7 — Assets
// ---------------------------------------------------------------------------
import {
  validateManifest, AssetCache,
  registerPrefab, instantiatePrefab, createPrefabRegistry,
  STARTER_PACK_MANIFEST,
} from '@/lib/engine-v2/assets';

describe('validateManifest', () => {
  it('passes for valid manifest', () => {
    const manifest = {
      version: '1.0.0',
      scene: 'test',
      assets: [{ id: 'mesh-1', type: 'mesh' as const, url: '/a.glb', essential: true }],
    };
    expect(validateManifest(manifest)).toHaveLength(0);
  });

  it('catches duplicate ids', () => {
    const manifest = {
      version: '1.0.0',
      scene: 'test',
      assets: [
        { id: 'dup', type: 'mesh' as const, url: '/a.glb', essential: false },
        { id: 'dup', type: 'texture' as const, url: '/b.png', essential: false },
      ],
    };
    const errors = validateManifest(manifest);
    expect(errors.some(e => e.includes('Duplicate'))).toBe(true);
  });

  it('catches missing version', () => {
    const manifest = { version: '', scene: 'test', assets: [] };
    const errors = validateManifest(manifest);
    expect(errors.some(e => e.includes('version'))).toBe(true);
  });
});

describe('AssetCache', () => {
  it('tracks loading lifecycle', () => {
    const cache = new AssetCache();
    const entry = { id: 'tex-1', type: 'texture' as const, url: '/tex.webp', essential: true };
    cache.register(entry);
    expect(cache.get('tex-1')?.status).toBe('pending');

    cache.markLoading('tex-1');
    expect(cache.get('tex-1')?.status).toBe('loading');

    cache.markLoaded('tex-1', { width: 512 });
    expect(cache.isLoaded('tex-1')).toBe(true);
    expect(cache.pendingEssentials()).toHaveLength(0);
  });

  it('identifies pending essentials', () => {
    const cache = new AssetCache();
    cache.register({ id: 'a', type: 'mesh' as const, url: '/a.glb', essential: true });
    cache.register({ id: 'b', type: 'mesh' as const, url: '/b.glb', essential: false });
    expect(cache.pendingEssentials()).toContain('a');
    expect(cache.pendingEssentials()).not.toContain('b');
  });
});

describe('Prefab system', () => {
  it('instantiates a prefab with overrides', () => {
    const registry = createPrefabRegistry();
    registerPrefab(registry, {
      id: 'coin',
      name: 'Coin',
      components: {
        Transform: { x: 0, y: 0 },
        Collectable: { value: 10 },
      },
      requiredAssets: ['coin-mesh'],
    });

    const instance = instantiatePrefab(registry, 'coin', { Transform: { x: 5, y: 10 } });
    expect(instance).not.toBeNull();
    expect((instance!['Transform'] as { x: number }).x).toBe(5);
    expect((instance!['Collectable'] as { value: number }).value).toBe(10);
  });

  it('returns null for missing prefab', () => {
    const registry = createPrefabRegistry();
    expect(instantiatePrefab(registry, 'ghost-prefab')).toBeNull();
  });
});

describe('STARTER_PACK_MANIFEST', () => {
  it('is a valid manifest', () => {
    expect(validateManifest(STARTER_PACK_MANIFEST)).toHaveLength(0);
  });

  it('has a version tag', () => {
    expect(STARTER_PACK_MANIFEST.version).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Phase 8 — Audio
// ---------------------------------------------------------------------------
import {
  AudioMixer, DuckingController, SoundBudget,
  shouldVirtualise, computeImpactVolume, shouldTriggerHaptic, DEFAULT_IMPACT,
} from '@/lib/engine-v2/audio';

describe('AudioMixer', () => {
  it('starts silent', () => {
    const mixer = new AudioMixer();
    expect(mixer.isAudioEnabled()).toBe(false);
    expect(mixer.effectiveVolume('music')).toBe(0);
  });

  it('returns volume after enabling', () => {
    const mixer = new AudioMixer();
    mixer.enableAudio();
    expect(mixer.effectiveVolume('music')).toBeGreaterThan(0);
  });

  it('mutes channel correctly', () => {
    const mixer = new AudioMixer();
    mixer.enableAudio();
    mixer.muteChannel('sfx');
    expect(mixer.effectiveVolume('sfx')).toBe(0);
    mixer.unmuteChannel('sfx');
    expect(mixer.effectiveVolume('sfx')).toBeGreaterThan(0);
  });
});

describe('DuckingController', () => {
  it('reduces music volume when ducking', () => {
    const ctrl = new DuckingController({ duckFactor: 0.3, fadeBackMs: 500 });
    ctrl.triggerDuck(0, 1000);
    const vol = ctrl.tick(500, 0.6);
    expect(vol).toBeCloseTo(0.6 * 0.3, 5);
    expect(ctrl.isDucking).toBe(true);
  });

  it('restores music after duck expires', () => {
    const ctrl = new DuckingController({ duckFactor: 0.3, fadeBackMs: 0 });
    ctrl.triggerDuck(0, 100);
    const vol = ctrl.tick(200, 0.6); // after duck end, fadeBackMs=0 so instant
    expect(vol).toBeCloseTo(0.6, 5);
    expect(ctrl.isDucking).toBe(false);
  });
});

describe('SoundBudget', () => {
  it('blocks acquisition over capacity', () => {
    const budget = new SoundBudget(2);
    expect(budget.acquire()).toBe(true);
    expect(budget.acquire()).toBe(true);
    expect(budget.acquire()).toBe(false);
  });

  it('releases correctly', () => {
    const budget = new SoundBudget(1);
    budget.acquire();
    budget.release();
    expect(budget.canPlay()).toBe(true);
  });
});

describe('shouldVirtualise', () => {
  it('virtualises sounds beyond max audible distance', () => {
    expect(shouldVirtualise(1000, 500, 0.8)).toBe(true);
  });

  it('does not virtualise nearby sounds', () => {
    expect(shouldVirtualise(100, 500, 0.8)).toBe(false);
  });

  it('virtualises silent sounds', () => {
    expect(shouldVirtualise(10, 500, 0)).toBe(true);
  });
});

describe('computeImpactVolume', () => {
  it('returns 0 for impulses below minimum', () => {
    expect(computeImpactVolume(0, DEFAULT_IMPACT)).toBe(0);
  });

  it('returns 1 for max impulse', () => {
    expect(computeImpactVolume(100, DEFAULT_IMPACT)).toBe(1);
  });
});

describe('shouldTriggerHaptic', () => {
  it('allows haptic when not reduced-motion', () => {
    expect(shouldTriggerHaptic(false)).toBe(true);
  });

  it('blocks haptic with prefers-reduced-motion', () => {
    expect(shouldTriggerHaptic(true)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Phase 9 — Engine safety
// ---------------------------------------------------------------------------
import {
  assertFinite, assertBounded, isFiniteBounded, EngineInvariantError,
  scanForNaN, triggerPanic, recoverFromPanic, newPanicState,
  resolveMeshId, resolveTextureId,
  SceneLoaderTimeout, SCENE_LOAD_TIMEOUT_MS,
  applyDegradation, MOBILE_SANITY_BUDGETS,
} from '@/lib/engine-v2/safety';
import { DEFAULT_BUDGETS as PERF_BUDGETS } from '@/lib/engine-v2/instrumentation';

describe('assertFinite', () => {
  it('passes for finite numbers', () => {
    expect(() => assertFinite(42, 'x')).not.toThrow();
  });

  it('throws EngineInvariantError for NaN', () => {
    expect(() => assertFinite(NaN, 'x')).toThrow(EngineInvariantError);
  });

  it('throws EngineInvariantError for Infinity', () => {
    expect(() => assertFinite(Infinity, 'y')).toThrow(EngineInvariantError);
  });
});

describe('assertBounded', () => {
  it('passes for in-range value', () => {
    expect(() => assertBounded(5, 0, 10, 'v')).not.toThrow();
  });

  it('throws for out-of-range value', () => {
    expect(() => assertBounded(15, 0, 10, 'v')).toThrow(EngineInvariantError);
  });
});

describe('isFiniteBounded', () => {
  it('returns true for valid values', () => {
    expect(isFiniteBounded(5, 0, 10)).toBe(true);
  });

  it('returns false for NaN', () => {
    expect(isFiniteBounded(NaN, 0, 10)).toBe(false);
  });
});

describe('scanForNaN', () => {
  it('returns no affected ids for clean bodies', () => {
    const bodies = [
      { id: 1, x: 0, y: 0, vx: 1, vy: 2 },
      { id: 2, x: 5, y: 3, vx: 0, vy: -1 },
    ];
    const result = scanForNaN(bodies);
    expect(result.hasNaN).toBe(false);
    expect(result.affectedIds).toHaveLength(0);
  });

  it('detects NaN in body', () => {
    const bodies = [
      { id: 1, x: NaN, y: 0, vx: 0, vy: 0 },
      { id: 2, x: 5, y: 3, vx: Infinity, vy: 0 },
    ];
    const result = scanForNaN(bodies);
    expect(result.hasNaN).toBe(true);
    expect(result.affectedIds).toContain(1);
    expect(result.affectedIds).toContain(2);
  });
});

describe('panic mode', () => {
  it('activates panic correctly', () => {
    const state = newPanicState();
    const panicked = triggerPanic(state, 'nan_detected', 'NaN in body 5', 1000);
    expect(panicked.active).toBe(true);
    expect(panicked.reason).toBe('nan_detected');
  });

  it('recovers cleanly', () => {
    const state = triggerPanic(newPanicState(), 'nan_detected', 'test', 0);
    const recovered = recoverFromPanic(state);
    expect(recovered.active).toBe(false);
    expect(recovered.reason).toBeNull();
  });
});

describe('fallback asset resolution', () => {
  it('returns fallback when requested id is unavailable', () => {
    const available = new Set<string>(['placeholder-mesh']);
    expect(resolveMeshId('missing-mesh', available)).toBe('placeholder-mesh');
  });

  it('returns requested id when available', () => {
    const available = new Set<string>(['my-mesh', 'placeholder-mesh']);
    expect(resolveMeshId('my-mesh', available)).toBe('my-mesh');
  });
});

describe('SceneLoaderTimeout', () => {
  it('is not expired before timeout', () => {
    const loader = new SceneLoaderTimeout(SCENE_LOAD_TIMEOUT_MS);
    loader.start(0);
    expect(loader.isExpired(5000)).toBe(false);
  });

  it('is expired after timeout', () => {
    const loader = new SceneLoaderTimeout(SCENE_LOAD_TIMEOUT_MS);
    loader.start(0);
    expect(loader.isExpired(SCENE_LOAD_TIMEOUT_MS + 1)).toBe(true);
  });

  it('is never expired before start', () => {
    const loader = new SceneLoaderTimeout();
    expect(loader.isExpired(99999)).toBe(false);
  });
});

describe('applyDegradation', () => {
  it('level 0 returns unchanged budgets', () => {
    expect(applyDegradation(PERF_BUDGETS, 0)).toEqual(PERF_BUDGETS);
  });

  it('level 1 reduces solver iterations', () => {
    const degraded = applyDegradation(PERF_BUDGETS, 1);
    expect(degraded.maxSolverIterations).toBeLessThan(PERF_BUDGETS.maxSolverIterations);
  });

  it('level 3 significantly reduces all limits', () => {
    const degraded = applyDegradation(PERF_BUDGETS, 3);
    expect(degraded.maxSolverIterations).toBeLessThanOrEqual(1);
    expect(degraded.maxContacts).toBeLessThan(PERF_BUDGETS.maxContacts);
    expect(degraded.maxEntities).toBeLessThan(PERF_BUDGETS.maxEntities);
  });
});

describe('MOBILE_SANITY_BUDGETS', () => {
  it('has tighter limits than default', () => {
    expect(MOBILE_SANITY_BUDGETS.physicsMs).toBeLessThan(PERF_BUDGETS.physicsMs);
    expect(MOBILE_SANITY_BUDGETS.maxEntities).toBeLessThan(PERF_BUDGETS.maxEntities);
  });
});
