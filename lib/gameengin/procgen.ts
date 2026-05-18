/**
 * lib/gameengin/procgen.ts
 *
 * NEXT-GEN — Deterministic procedural world generation.
 *
 *  - WaveFunctionCollapse — Constraint-propagation tile/structure synthesis
 *  - BiomeSynthesizer     — Multi-octave biome blending + macro structure
 *  - ChunkScheduler       — Async budgeted chunk generation scheduler
 */

/** Mulberry32 — small, fast, deterministic PRNG. */
function mulberry32(seed: number: () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export interface WFCTile {
  id: string;
  /** Edge socket descriptors per side (N, E, S, W). */
  edges: [string, string, string, string];
  weight?: number;
}

/**
 * Wave Function Collapse — collapse a 2D grid of tiles by iteratively choosing
 * the lowest-entropy cell and propagating socket constraints to neighbours.
 */
export class WaveFunctionCollapse {
  private readonly tiles: WFCTile[];
  private readonly width: number;
  private readonly height: number;
  private readonly rng: () => number;
  private grid: Set<number>[];

  constructor(opts: { tiles: WFCTile[]; width: number; height: number; seed?: number }) {
    this.tiles = opts.tiles;
    this.width = Math.max(1, opts.width);
    this.height = Math.max(1, opts.height);
    this.rng = mulberry32(opts.seed ?? 1);
    this.grid = [];
    this.reset();
  }

  reset(): void {
    const all = new Set<number>(this.tiles.map((_, i: number) => i));
    this.grid = new Array(this.width * this.height).fill(null).map(() => new Set(all));
  }

  /** Run the algorithm. Returns null on contradiction. */
  collapse(maxSteps = 10000): (string | null)[] | null {
    for (let step = 0; step < maxSteps; step++) {
      const next = this.lowestEntropyCell();
      if (next === -1) return this.snapshot();
      const choices = Array.from(this.grid[next]);
      if (choices.length === 0) return null;
      const total = choices.reduce((s, i: number) => s + (this.tiles[i].weight ?? 1), 0);
      let pick = this.rng() * total;
      let chosen = choices[0];
      for (const i of choices) {
        pick -= this.tiles[i].weight ?? 1;
        if (pick <= 0) { chosen = i; break; }
      }
      this.grid[next] = new Set([chosen]);
      if (!this.propagate(next)) return null;
    }
    return null;
  }

  private lowestEntropyCell(): number {
    let best = -1;
    let bestSize = Infinity;
    for (let i = 0; i < this.grid.length; i++) {
      const size = this.grid[i].size;
      if (size > 1 && size < bestSize) {
        bestSize = size;
        best = i;
      }
    }
    return best;
  }

  private propagate(start: number): boolean {
    const queue = [start];
    while (queue.length > 0) {
      const i = queue.shift() as number;
      const x = i % this.width;
      const y = Math.floor(i / this.width);
      const neighbours: Array<[number, number, number, number]> = [
        [x, y - 1, 0, 2], // N -> their S
        [x + 1, y, 1, 3], // E -> their W
        [x, y + 1, 2, 0], // S -> their N
        [x - 1, y, 3, 1], // W -> their E
      ];
      for (const [nx, ny, mySide, theirSide] of neighbours) {
        if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
        const ni = ny * this.width + nx;
        const allowedSockets = new Set<string>();
        for (const idx of this.grid[i]) allowedSockets.add(this.tiles[idx].edges[mySide]);
        let changed = false;
        for (const idx of Array.from(this.grid[ni])) {
          if (!allowedSockets.has(this.tiles[idx].edges[theirSide])) {
            this.grid[ni].delete(idx);
            changed = true;
          }
        }
        if (this.grid[ni].size === 0) return false;
        if (changed) queue.push(ni);
      }
    }
    return true;
  }

  private snapshot(): (string | null)[] {
    return this.grid.map((cell) => {
      if (cell.size === 1) {
        const [idx] = Array.from(cell);
        return this.tiles[idx].id;
      }
      return null;
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export type BiomeId = 'plains' | 'forest' | 'desert' | 'tundra' | 'ocean' | 'mountain';

export interface BiomeSample {
  biome: BiomeId;
  elevation: number;   // -1..1
  moisture: number;    // 0..1
  temperature: number; // 0..1
}

/**
 * Multi-octave biome synthesizer. Deterministic for a given seed; samples a
 * (x,z) world position and returns biome + macro fields.
 */
export class BiomeSynthesizer {
  private readonly seed: number;

  constructor(seed = 1) { this.seed = seed >>> 0; }

  sample(x: number, z: number): BiomeSample {
    const elevation = this.fbm(x * 0.005, z * 0.005, 4) * 2 - 1;
    const moisture  = this.fbm(x * 0.01 + 911, z * 0.01 + 911, 3);
    const temperature = this.fbm(x * 0.008 - 137, z * 0.008 - 137, 3);
    let biome: BiomeId;
    if (elevation < -0.2) biome = 'ocean';
    else if (elevation > 0.6) biome = 'mountain';
    else if (temperature < 0.25) biome = 'tundra';
    else if (moisture < 0.3) biome = 'desert';
    else if (moisture > 0.6) biome = 'forest';
    else biome = 'plains';
    return { biome, elevation, moisture, temperature };
  }

  private hash(ix: number, iz: number): number {
    let h = (ix * 374761393 + iz * 668265263 + this.seed * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  private noise(x: number, z: number): number {
    const ix = Math.floor(x), iz = Math.floor(z);
    const fx = x - ix, fz = z - iz;
    const a = this.hash(ix, iz);
    const b = this.hash(ix + 1, iz);
    const c = this.hash(ix, iz + 1);
    const d = this.hash(ix + 1, iz + 1);
    const ux = fx * fx * (3 - 2 * fx);
    const uz = fz * fz * (3 - 2 * fz);
    return a * (1 - ux) * (1 - uz) + b * ux * (1 - uz) + c * (1 - ux) * uz + d * ux * uz;
  }

  private fbm(x: number, z: number, octaves: number): number {
    let total = 0, amp = 0.5, freq = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * freq, z * freq) * amp;
      max += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return total / max;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export interface ChunkJob {
  id: string;
  priority: number;          // higher = more important
  estimatedCostMs: number;
  run(): Promise<void>;
}

export interface SchedulerConfig {
  /** Max ms of work per scheduling tick (frame budget for procgen). */
  budgetPerTickMs?: number;
  /** Max concurrent in-flight jobs. */
  maxConcurrent?: number;
}

/**
 * Async procedural-chunk scheduler with frame-budget backpressure.
 * Scheduling is priority-first, FIFO within a priority band.
 */
export class ChunkScheduler {
  private readonly budget: number;
  private readonly maxConcurrent: number;
  private queue: ChunkJob[] = [];
  private inFlight = 0;
  private completed = 0;

  constructor(config: SchedulerConfig = {}) {
    this.budget = Math.max(1, config.budgetPerTickMs ?? 4);
    this.maxConcurrent = Math.max(1, config.maxConcurrent ?? 2);
  }

  enqueue(job: ChunkJob): void {
    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  /** Drain jobs up to the per-tick budget. */
  async tick(): Promise<number> {
    let spent = 0;
    let started = 0;
    while (this.queue.length > 0 && spent + this.queue[0].estimatedCostMs <= this.budget && this.inFlight < this.maxConcurrent) {
      const job = this.queue.shift() as ChunkJob;
      spent += job.estimatedCostMs;
      this.inFlight += 1;
      started += 1;
      void job.run().finally(() => {
        this.inFlight -= 1;
        this.completed += 1;
      });
    }
    return started;
  }

  get pending(): number { return this.queue.length; }
  get active(): number { return this.inFlight; }
  get totalCompleted(): number { return this.completed; }
}
