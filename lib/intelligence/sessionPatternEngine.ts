/**
 * lib/intelligence/sessionPatternEngine.ts
 *
 * SESSION PATTERN ENGINE — 2026
 *
 * Learns your DREAMengin usage patterns in real-time from the dreamOSBus
 * artifact stream. Uses a bigram Markov chain over subsystem activations
 * with TF.js tensor normalisation for fast probability computation.
 *
 * Runs entirely in-browser: privacy-first, zero server round-trips.
 *
 * After as few as 3 transitions it begins making useful predictions.
 * TF.js enhances normalisation — graceful pure-math fallback if unavailable.
 *
 * Usage:
 *   const engine = new SessionPatternEngine();
 *   await engine.init();
 *   engine.ingest('CodeEngin');
 *   engine.ingest('LabEngin');
 *   const [next] = engine.predict('LabEngin');
 *   // { subsystemId: 'GameEngin', confidence: 0.72, label: '🎮 GameEngin' }
 */

export interface PredictedNext {
  /** Canonical subsystem ID as used in dreamOSBus artifacts. */
  subsystemId: string;
  /** Normalised probability (0–1). */
  confidence: number;
  /** Emoji-prefixed human-readable label. */
  label: string;
}

export interface PatternEngineState {
  /** Total transitions ingested this session. */
  transitionCount: number;
  /** Unique subsystems seen this session, ordered by first appearance. */
  subsystemsSeen: readonly string[];
  /** Whether the engine has enough data to produce reliable predictions. */
  isReady: boolean;
  /** Whether TF.js is active for enhanced normalisation. */
  tfReady: boolean;
}

// Minimum transitions before predictions are considered reliable.
const MIN_TRANSITIONS = 3;

// Known subsystem display labels.
const SUBSYSTEM_LABELS: Record<string, string> = {
  CodeEngin: '💻 CodeEngin',
  LabEngin: '🧪 LabEngin',
  GameEngin: '🎮 GameEngin',
  ContentEngin: '✏️ ContentEngin',
  BrandingEngin: '🎨 BrandingEngin',
  StarMakerEngin: '🎵 StarMakerEngin',
  'Dr. Eams': '🤖 Dr. Eams',
  dreamspace: '🌌 DreamSpace',
  home: '🏠 Home',
  profile: '👤 Profile',
};

function labelFor(subsystemId: string): string {
  return SUBSYSTEM_LABELS[subsystemId] ?? `⬡ ${subsystemId}`;
}

// ─── Session Pattern Engine ───────────────────────────────────────────────────

export class SessionPatternEngine {
  /** Bigram counts: transitions[from][to] = count */
  private readonly transitions = new Map<string, Map<string, number>>();
  /** Ordered activation sequence for this session. */
  private readonly activationSequence: string[] = [];
  /** Unique subsystems seen, ordered by first appearance. */
  private readonly subsystemsSeen: string[] = [];

  private tfReady = false;

  // ── Lifecycle ────────────────────────────────────────────────────────────

  async init(): Promise<void> {
    try {
      const tf = await import('@tensorflow/tfjs');
      try {
        await import('@tensorflow/tfjs-backend-webgpu');
        await tf.setBackend('webgpu');
      } catch {
        try {
          await tf.setBackend('webgl');
        } catch {
          await tf.setBackend('cpu');
        }
      }
      await tf.ready();
      this.tfReady = true;
    } catch {
      // TF.js not available; use normalised counts directly.
    }
  }

  // ── Ingestion ────────────────────────────────────────────────────────────

  /**
   * Ingest a subsystem activation event.
   * Call whenever a new subsystem becomes the focus (route change, engin open, etc.).
   */
  ingest(subsystemId: string): void {
    const prev = this.activationSequence[this.activationSequence.length - 1];
    this.activationSequence.push(subsystemId);

    if (!this.subsystemsSeen.includes(subsystemId)) {
      this.subsystemsSeen.push(subsystemId);
    }

    if (prev !== undefined && prev !== subsystemId) {
      let fromMap = this.transitions.get(prev);
      if (!fromMap) {
        fromMap = new Map<string, number>();
        this.transitions.set(prev, fromMap);
      }
      fromMap.set(subsystemId, (fromMap.get(subsystemId) ?? 0) + 1);
    }
  }

  // ── Prediction ───────────────────────────────────────────────────────────

  /**
   * Predict the top-N most likely next subsystem activations given the current
   * active subsystem. Returns an empty array if not enough data yet or if
   * the engine has not reached the minimum transition threshold.
   */
  predict(currentSubsystemId: string, topN = 3): PredictedNext[] {
    if (this.activationSequence.length - 1 < MIN_TRANSITIONS) return [];
    const fromMap = this.transitions.get(currentSubsystemId);
    if (!fromMap || fromMap.size === 0) return [];

    const entries = Array.from(fromMap.entries());
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    if (total === 0) return [];

    let normalised: { subsystemId: string; confidence: number }[];

    if (this.tfReady) {
      normalised = this.normaliseWithTF(entries, total);
    } else {
      normalised = entries.map(([subsystemId, count]) => ({
        subsystemId,
        confidence: count / total,
      }));
    }

    return normalised
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, topN)
      .map(({ subsystemId, confidence }) => ({
        subsystemId,
        confidence,
        label: labelFor(subsystemId),
      }));
  }

  /**
   * Returns the engine's current observable state.
   */
  getState(): PatternEngineState {
    return {
      transitionCount: Math.max(0, this.activationSequence.length - 1),
      subsystemsSeen: [...this.subsystemsSeen],
      isReady: this.activationSequence.length - 1 >= MIN_TRANSITIONS,
      tfReady: this.tfReady,
    };
  }

  /**
   * Returns the raw activation sequence for the current session.
   */
  getActivationSequence(): readonly string[] {
    return this.activationSequence;
  }

  /**
   * Wipes all accumulated transitions (used when starting a fresh session).
   */
  reset(): void {
    this.transitions.clear();
    this.activationSequence.length = 0;
    this.subsystemsSeen.length = 0;
  }

  // ── TF.js normalisation ───────────────────────────────────────────────────

  /**
   * Uses TF.js softmax-like normalisation for sharper probability separation
   * compared to raw frequency division.
   * Falls back to raw ratio on any TF error.
   */
  private normaliseWithTF(
    entries: [string, number][],
    total: number,
  ): { subsystemId: string; confidence: number }[] {
    try {
      // Lazy require — tf is already loaded at this point.
      // Dynamic require is intentional: avoids top-level TF.js import
      // which would cause SSR issues in Next.js.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const tf = require('@tensorflow/tfjs') as typeof import('@tensorflow/tfjs');

      const rawProbs = entries.map(([, count]) => count / total);
      const tensor = tf.tensor1d(rawProbs);
      const softmax = tf.softmax(tensor);
      const probsArray = Array.from(softmax.dataSync()) as number[];
      tensor.dispose();
      softmax.dispose();

      return entries.map(([subsystemId], i) => ({
        subsystemId,
        confidence: probsArray[i] ?? 0,
      }));
    } catch {
      return entries.map(([subsystemId, count]) => ({
        subsystemId,
        confidence: count / total,
      }));
    }
  }
}
