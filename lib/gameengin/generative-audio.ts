/**
 * lib/gameengin/generative-audio.ts
 *
 * NEXT-GEN — Generative + adaptive audio.
 *
 *  - AdaptiveMusicEngine — Tension-driven adaptive music graph
 *  - NeuralFoley         — On-device neural foley synthesizer
 */

export interface MusicNode {
  id: string;
  loopUrl: string;
  /** Suggested tension band [min, max] in 0..1. */
  tensionRange: [number, number];
}

export interface MusicEdge {
  from: string;
  to: string;
  /** Allowed transition condition. */
  condition?: (tension: number) => boolean;
  crossfadeMs: number;
}

export interface MusicConfig {
  nodes: MusicNode[];
  edges: MusicEdge[];
  startNodeId: string;
}

/**
 * Adaptive music graph. Caller updates the tension scalar; engine selects the
 * appropriate node and emits transition events with crossfade duration.
 */
export class AdaptiveMusicEngine {
  private readonly nodes: Map<string, MusicNode>;
  private readonly outgoing: Map<string, MusicEdge[]>;
  private currentId: string;
  private tension = 0;
  private subscribers: Array<(t: { from: string; to: string; crossfadeMs: number }) => void> = [];

  constructor(config: MusicConfig) {
    this.nodes = new Map(config.nodes.map((n) => [n.id, n]));
    this.outgoing = new Map();
    for (const edge of config.edges) {
      const arr = this.outgoing.get(edge.from) ?? [];
      arr.push(edge);
      this.outgoing.set(edge.from, arr);
    }
    this.currentId = config.startNodeId;
    if (!this.nodes.has(this.currentId)) {
      throw new Error(`AdaptiveMusicEngine: start node "${this.currentId}" not in nodes`);
    }
  }

  setTension(value: number): void {
    this.tension = Math.min(1, Math.max(0, value));
    this.maybeTransition();
  }

  onTransition(cb: (t: { from: string; to: string; crossfadeMs: number }) => void): () => void {
    this.subscribers.push(cb);
    return () => { this.subscribers = this.subscribers.filter((s) => s !== cb); };
  }

  private maybeTransition(): void {
    const candidates = this.outgoing.get(this.currentId) ?? [];
    for (const edge of candidates) {
      const target = this.nodes.get(edge.to);
      if (!target) continue;
      const inBand = this.tension >= target.tensionRange[0] && this.tension <= target.tensionRange[1];
      const allowed = edge.condition ? edge.condition(this.tension) : true;
      if (inBand && allowed) {
        const from = this.currentId;
        this.currentId = edge.to;
        for (const sub of this.subscribers) sub({ from, to: edge.to, crossfadeMs: edge.crossfadeMs });
        return;
      }
    }
  }

  get currentNode(): MusicNode { return this.nodes.get(this.currentId) as MusicNode; }
  get currentTension(): number { return this.tension; }
}

// ─────────────────────────────────────────────────────────────────────────────

export type FoleyCategory = 'footstep' | 'impact' | 'rustle' | 'whoosh' | 'splash';

export interface FoleyParams {
  category: FoleyCategory;
  /** Surface or material (e.g. "wood", "metal", "water"). */
  surface: string;
  /** Velocity / intensity in 0..1. */
  intensity: number;
  /** Optional seed for deterministic synthesis. */
  seed?: number;
}

export interface FoleyResult {
  pcm: Float32Array;
  sampleRate: number;
  ms: number;
}

/**
 * Lightweight on-device foley synthesizer. Produces a short PCM buffer per
 * request; uses a deterministic procedural model when no neural backend is
 * attached, so it works fully offline and SSR-safe.
 */
export class NeuralFoley {
  private readonly sampleRate: number;
  private backend: ((p: FoleyParams) => Promise<FoleyResult>) | null = null;
  private generated = 0;

  constructor(opts: { sampleRate?: number } = {}) {
    this.sampleRate = Math.max(8000, opts.sampleRate ?? 48000);
  }

  attachBackend(backend: (p: FoleyParams) => Promise<FoleyResult>): void {
    this.backend = backend;
  }

  async synthesize(params: FoleyParams): Promise<FoleyResult> {
    if (this.backend) {
      const r = await this.backend(params);
      this.generated += 1;
      return r;
    }
    return this.proceduralSynth(params);
  }

  private proceduralSynth(params: FoleyParams): FoleyResult {
    const ms = this.durationFor(params.category);
    const samples = Math.floor((ms / 1000) * this.sampleRate);
    const pcm = new Float32Array(samples);
    let seed = (params.seed ?? 1) >>> 0;
    const rng = () => {
      seed = (seed + 0x6D2B79F5) >>> 0;
      let r = seed;
      r = Math.imul(r ^ (r >>> 15), r | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296 * 2 - 1;
    };
    const baseFreq = this.surfacePitch(params.surface);
    const decay = 4 + (1 - params.intensity) * 8;
    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const env = Math.exp(-t * decay) * params.intensity;
      const tonal = Math.sin(2 * Math.PI * baseFreq * t);
      const noisy = rng();
      pcm[i] = env * (0.6 * noisy + 0.4 * tonal);
    }
    this.generated += 1;
    return { pcm, sampleRate: this.sampleRate, ms };
  }

  private durationFor(category: FoleyCategory): number {
    switch (category) {
      case 'footstep': return 120;
      case 'impact':   return 200;
      case 'rustle':   return 300;
      case 'whoosh':   return 400;
      case 'splash':   return 350;
    }
  }

  private surfacePitch(surface: string): number {
    switch (surface.toLowerCase()) {
      case 'metal':  return 1200;
      case 'wood':   return 400;
      case 'stone':  return 250;
      case 'water':  return 180;
      case 'grass':  return 150;
      default:       return 300;
    }
  }

  get generatedCount(): number { return this.generated; }
}
