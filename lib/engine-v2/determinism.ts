// lib/engine-v2/determinism.ts
// Phase 2 — Determinism + Replay: state hash, input queue, replay recorder/player.
// Pure module — no React, no DOM dependencies.

// ---------------------------------------------------------------------------
// Deterministic RNG (mulberry32 — fast, seedable, deterministic)
// ---------------------------------------------------------------------------

export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Floating-point discipline
// ---------------------------------------------------------------------------

/** Maximum safe absolute value to avoid IEEE 754 infinities in physics. */
const FP_MAX = 1e6;
/** Epsilon below which values are treated as zero to avoid unstable branching. */
const FP_EPSILON = 1e-10;

export function fpClamp(v: number): number {
  if (!isFinite(v)) return 0;
  return v < -FP_MAX ? -FP_MAX : v > FP_MAX ? FP_MAX : v;
}

export function fpZeroFlush(v: number): number {
  return Math.abs(v) < FP_EPSILON ? 0 : v;
}

export function fpSafe(v: number): number {
  return fpZeroFlush(fpClamp(v));
}

// ---------------------------------------------------------------------------
// State hash (djb2 over Float32 data)
// ---------------------------------------------------------------------------

/**
 * Compute a deterministic 32-bit hash over an array of numbers.
 * Used to detect divergence between two simulation runs of the same scenario.
 */
export function computeStateHash(data: ArrayLike<number>): number {
  let hash = 5381;
  for (let i = 0; i < data.length; i++) {
    // Quantize to 4 decimal places to avoid FP noise.
    const q = Math.round(data[i] * 10000);
    hash = ((hash << 5) + hash + q) >>> 0;
  }
  return hash >>> 0;
}

/** Build a flat array from body positions + velocities for hashing. */
export function buildHashData(bodies: ReadonlyArray<{ x: number; y: number; vx: number; vy: number }>): Float32Array {
  const arr = new Float32Array(bodies.length * 4);
  for (let i = 0; i < bodies.length; i++) {
    arr[i * 4] = fpSafe(bodies[i].x);
    arr[i * 4 + 1] = fpSafe(bodies[i].y);
    arr[i * 4 + 2] = fpSafe(bodies[i].vx);
    arr[i * 4 + 3] = fpSafe(bodies[i].vy);
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Deterministic pair ordering
// ---------------------------------------------------------------------------

export interface BodyPair {
  a: number; // body id
  b: number; // body id
}

/** Normalise pair so a ≤ b — stable, independent of insertion order. */
export function normalisePair(a: number, b: number): BodyPair {
  return a <= b ? { a, b } : { a: b, b: a };
}

/** Sort pairs deterministically: first by a, then by b. */
export function sortPairs(pairs: BodyPair[]): BodyPair[] {
  return [...pairs].sort((p, q) => p.a !== q.a ? p.a - q.a : p.b - q.b);
}

// ---------------------------------------------------------------------------
// Deterministic input queue
// ---------------------------------------------------------------------------

export type InputActionType = string;

export interface InputEvent {
  /** Fixed-step tick index at which this input takes effect. */
  tick: number;
  entityId: number;
  action: InputActionType;
  /** Normalised value in range [-1, 1] or 0/1 for digital inputs. */
  value: number;
}

export class DeterministicInputQueue {
  private readonly queue: InputEvent[] = [];

  enqueue(evt: InputEvent): void {
    this.queue.push(evt);
    // Keep sorted by tick for efficient draining.
    this.queue.sort((a, b) => a.tick - b.tick);
  }

  /** Drain all events for the given tick. Modifies the queue in place. */
  drainForTick(tick: number): InputEvent[] {
    const out: InputEvent[] = [];
    while (this.queue.length > 0 && this.queue[0].tick <= tick) {
      out.push(this.queue.shift()!);
    }
    return out;
  }

  /** Peek at events without removing them. */
  peekAll(): ReadonlyArray<InputEvent> {
    return this.queue;
  }

  clear(): void {
    this.queue.length = 0;
  }

  get length(): number {
    return this.queue.length;
  }
}

// ---------------------------------------------------------------------------
// Replay recording + playback
// ---------------------------------------------------------------------------

export interface BodySnapshot {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;
}

export interface SimSnapshot {
  tick: number;
  bodies: BodySnapshot[];
  stateHash: number;
}

export interface ReplayRecord {
  seed: number;
  initialSnapshot: SimSnapshot;
  inputs: InputEvent[];
  tickHashes: Map<number, number>;
}

export class ReplayRecorder {
  private record: ReplayRecord | null = null;

  begin(seed: number, initialSnapshot: SimSnapshot): void {
    this.record = {
      seed,
      initialSnapshot,
      inputs: [],
      tickHashes: new Map(),
    };
  }

  recordInput(evt: InputEvent): void {
    this.record?.inputs.push({ ...evt });
  }

  recordHash(tick: number, hash: number): void {
    this.record?.tickHashes.set(tick, hash);
  }

  finish(): ReplayRecord {
    if (!this.record) throw new Error('No recording in progress');
    return this.record;
  }

  isRecording(): boolean {
    return this.record !== null;
  }

  reset(): void {
    this.record = null;
  }
}

export interface ReplayResult {
  passed: boolean;
  /** Ticks where hash diverged (should be empty on pass). */
  divergedTicks: number[];
}

export class ReplayPlayer {
  /**
   * Compare a recorded replay's hashes against a new set of hashes produced
   * by running the same scenario again. Returns diverged tick list.
   */
  compare(record: ReplayRecord, newHashes: Map<number, number>): ReplayResult {
    const divergedTicks: number[] = [];
    for (const [tick, expected] of record.tickHashes) {
      const actual = newHashes.get(tick);
      if (actual === undefined || actual !== expected) {
        divergedTicks.push(tick);
      }
    }
    return { passed: divergedTicks.length === 0, divergedTicks };
  }
}

// ---------------------------------------------------------------------------
// Snapshot compression: delta snapshots
// ---------------------------------------------------------------------------

export interface DeltaSnapshot {
  fromTick: number;
  toTick: number;
  changed: BodySnapshot[];
}

export function computeDelta(prev: SimSnapshot, next: SimSnapshot): DeltaSnapshot {
  const changed: BodySnapshot[] = [];
  const prevMap = new Map(prev.bodies.map(b => [b.id, b]));

  for (const body of next.bodies) {
    const p = prevMap.get(body.id);
    if (!p ||
        p.x !== body.x || p.y !== body.y ||
        p.vx !== body.vx || p.vy !== body.vy ||
        p.angle !== body.angle || p.angularVel !== body.angularVel) {
      changed.push(body);
    }
  }

  return { fromTick: prev.tick, toTick: next.tick, changed };
}

// ---------------------------------------------------------------------------
// Checkpoint (rewind to last checkpoint)
// ---------------------------------------------------------------------------

export class CheckpointManager {
  private checkpoints: SimSnapshot[] = [];
  private readonly maxCheckpoints: number;

  constructor(maxCheckpoints = 10) {
    this.maxCheckpoints = maxCheckpoints;
  }

  save(snapshot: SimSnapshot): void {
    this.checkpoints.push(snapshot);
    if (this.checkpoints.length > this.maxCheckpoints) {
      this.checkpoints.shift();
    }
  }

  /** Return the most recent checkpoint, or null if none saved. */
  lastCheckpoint(): SimSnapshot | null {
    return this.checkpoints.length > 0
      ? this.checkpoints[this.checkpoints.length - 1]
      : null;
  }

  clear(): void {
    this.checkpoints = [];
  }
}
