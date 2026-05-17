/**
 * lib/gameengin/accessibility-ai.ts
 *
 * NEXT-GEN — Real-time accessibility AI.
 *
 *  - RealtimeCaptioner    — On-device speech-to-caption with hard latency budget
 *  - MotionReductionAI    — Adaptive vestibular-safety motion governor
 *  - ColorVisionAdapter   — Per-user color-vision adapter (protan/deutan/tritan)
 */

export interface CaptionLine {
  speaker?: string;
  text: string;
  /** Wall-clock ms when produced. */
  t: number;
}

export interface CaptionerConfig {
  /** Hard latency budget per chunk in ms. */
  latencyBudgetMs?: number;
  /** Maximum captions retained for replay. */
  historySize?: number;
}

/**
 * Real-time captioner. Wraps an injected speech-to-text engine; falls back to
 * a simple energy-based "speech detected" placeholder so the UI still shows
 * activity when no model is wired.
 */
export class RealtimeCaptioner {
  private readonly latencyBudgetMs: number;
  private readonly historySize: number;
  private engine: ((pcm: Float32Array, sampleRate: number) => Promise<string>) | null = null;
  private history: CaptionLine[] = [];
  private subscribers: Array<(line: CaptionLine) => void> = [];

  constructor(config: CaptionerConfig = {}) {
    this.latencyBudgetMs = Math.max(50, config.latencyBudgetMs ?? 350);
    this.historySize = Math.max(8, config.historySize ?? 64);
  }

  attachEngine(engine: (pcm: Float32Array, sampleRate: number) => Promise<string>): void {
    this.engine = engine;
  }

  onCaption(cb: (line: CaptionLine) => void): () => void {
    this.subscribers.push(cb);
    return () => { this.subscribers = this.subscribers.filter((s: Record<string, unknown>) => s !== cb); };
  }

  async ingest(pcm: Float32Array, sampleRate: number, speaker?: string): Promise<CaptionLine | null> {
    const text = await this.transcribe(pcm, sampleRate);
    if (!text) return null;
    const line: CaptionLine = { speaker, text, t: Date.now() };
    this.history.push(line);
    if (this.history.length > this.historySize) {
      this.history.splice(0, this.history.length - this.historySize);
    }
    for (const sub of this.subscribers) sub(line);
    return line;
  }

  recent(limit = 16): CaptionLine[] {
    return this.history.slice(-limit);
  }

  get budgetMs(): number { return this.latencyBudgetMs; }

  private async transcribe(pcm: Float32Array, sampleRate: number): Promise<string | null> {
    if (this.engine) {
      try {
        const result = await this.withTimeout(this.engine(pcm, sampleRate), this.latencyBudgetMs);
        const trimmed = result.trim();
        return trimmed.length > 0 ? trimmed : null;
      } catch {
        return null;
      }
    }
    // Fallback: emit "[speech]" when energy is above noise floor.
    let energy = 0;
    for (let i = 0; i < pcm.length; i++) energy += pcm[i] * pcm[i];
    const rms = Math.sqrt(energy / Math.max(1, pcm.length));
    return rms > 0.02 ? '[speech]' : null;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>(resolve: Record<string, unknown>, reject: Record<string, unknown> => {
      const timer = setTimeout(() => reject(new Error('caption_timeout')), ms);
      promise.then(
        (v) => { clearTimeout(timer); resolve(v); },
        (e) => { clearTimeout(timer); reject(e instanceof Error ? e : new Error(String(e))); },
      );
    });
  }
}

// -----------------------------------------------------------------------------

export interface MotionMetrics {
  /** Average angular velocity (rad/s) over the recent window. */
  angularVelocity: number;
  /** Camera shake intensity 0..1. */
  shake: number;
  /** Field-of-view degrees. */
  fovDeg: number;
  /** Heuristic motion-sickness reports per minute. */
  reportsPerMinute: number;
}

export interface MotionPolicy {
  maxAngularVelocity: number;
  maxShake: number;
  maxFovDeg: number;
  /** Suggested vignette opacity in 0..1. */
  vignette: number;
}

export interface MotionReductionConfig {
  /** User opt-in level: off / mild / strict. */
  level?: 'off' | 'mild' | 'strict';
}

/**
 * Adaptive motion-reduction governor. Given runtime metrics and user prefs,
 * proposes per-frame caps the renderer must respect. Inspired by W3C
 * `prefers-reduced-motion` and vestibular-safety guidance.
 */
export class MotionReductionAI {
  private level: 'off' | 'mild' | 'strict';
  private appliedReductions = 0;

  constructor(config: MotionReductionConfig = {}) {
    this.level = config.level ?? 'mild';
  }

  setLevel(level: 'off' | 'mild' | 'strict'): void { this.level = level; }

  policy(metrics: MotionMetrics): MotionPolicy {
    if (this.level === 'off') {
      return { maxAngularVelocity: Infinity, maxShake: 1, maxFovDeg: 120, vignette: 0 };
    }
    const base: MotionPolicy = this.level === 'strict'
      ? { maxAngularVelocity: 1.0, maxShake: 0.15, maxFovDeg: 75, vignette: 0.25 }
      : { maxAngularVelocity: 2.0, maxShake: 0.4,  maxFovDeg: 90, vignette: 0.1 };
    if (metrics.reportsPerMinute > 1) {
      base.maxAngularVelocity *= 0.75;
      base.maxShake *= 0.75;
      base.vignette = Math.min(1, base.vignette + 0.1);
    }
    if (metrics.angularVelocity > base.maxAngularVelocity || metrics.shake > base.maxShake) {
      this.appliedReductions += 1;
    }
    return base;
  }

  get reductionsApplied(): number { return this.appliedReductions; }
  get currentLevel(): 'off' | 'mild' | 'strict' { return this.level; }
}

// -----------------------------------------------------------------------------

export type ColorVisionType = 'normal' | 'protan' | 'deutan' | 'tritan';

/**
 * Per-user color-vision adapter. Provides a 3x3 RGB transform matrix that
 * post-processing can sample to remap colours for the user's vision profile.
 * Matrices follow Brettel/Vienot/Mollon daltonization references.
 */
export class ColorVisionAdapter {
  private profile: ColorVisionType = 'normal';
  private severity = 1;

  setProfile(profile: ColorVisionType, severity = 1): void {
    this.profile = profile;
    this.severity = Math.min(1, Math.max(0, severity));
  }

  matrix(): number[] {
    const identity = [1, 0, 0,  0, 1, 0,  0, 0, 1];
    if (this.profile === 'normal') return identity;
    const m = ColorVisionAdapter.MATRICES[this.profile];
    if (this.severity >= 1) return [...m];
    return identity.map(v: Record<string, unknown>, i: number => v * (1 - this.severity) + m[i] * this.severity);
  }

  apply(rgb: [number, number, number]): [number, number, number] {
    const m = this.matrix();
    return [
      m[0] * rgb[0] + m[1] * rgb[1] + m[2] * rgb[2],
      m[3] * rgb[0] + m[4] * rgb[1] + m[5] * rgb[2],
      m[6] * rgb[0] + m[7] * rgb[1] + m[8] * rgb[2],
    ];
  }

  get currentProfile(): ColorVisionType { return this.profile; }
  get currentSeverity(): number { return this.severity; }

  // Brettel-style daltonization simulation matrices (sRGB linear).
  private static readonly MATRICES: Record<Exclude<ColorVisionType, 'normal'>, number[]> = {
    protan: [0.567, 0.433, 0.000,  0.558, 0.442, 0.000,  0.000, 0.242, 0.758],
    deutan: [0.625, 0.375, 0.000,  0.700, 0.300, 0.000,  0.000, 0.300, 0.700],
    tritan: [0.950, 0.050, 0.000,  0.000, 0.433, 0.567,  0.000, 0.475, 0.525],
  };
}
