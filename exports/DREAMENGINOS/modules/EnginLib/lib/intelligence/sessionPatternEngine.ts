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

// Transition count above which cold-start weights are no longer blended in.
const COLD_START_THRESHOLD = 10;

// Pre-defined common path weights used as warm defaults until the engine has
// accumulated enough transitions to rely solely on learned data.
// Each entry lists [destinationSubsystemId, defaultWeight] pairs (weights sum to 1).
const COLD_START_WEIGHTS: Record<string, [string, number][]> = {
  home:           [['CodeEngin', 0.35], ['LabEngin', 0.25], ['GameEngin', 0.20], ['ContentEngin', 0.20]],
  profile:        [['home', 0.50], ['CodeEngin', 0.30], ['LabEngin', 0.20]],
  dreamspace:     [['home', 0.40], ['CodeEngin', 0.30], ['LabEngin', 0.30]],
  CodeEngin:      [['LabEngin', 0.40], ['GameEngin', 0.30], ['ContentEngin', 0.30]],
  LabEngin:       [['CodeEngin', 0.40], ['GameEngin', 0.35], ['ContentEngin', 0.25]],
  GameEngin:      [['CodeEngin', 0.35], ['ContentEngin', 0.30], ['BrandingEngin', 0.35]],
  ContentEngin:   [['BrandingEngin', 0.40], ['CodeEngin', 0.30], ['GameEngin', 0.30]],
  BrandingEngin:  [['ContentEngin', 0.40], ['GameEngin', 0.30], ['StarMakerEngin', 0.30]],
  StarMakerEngin: [['BrandingEngin', 0.40], ['ContentEngin', 0.30], ['GameEngin', 0.30]],
  'Dr. Eams':     [['home', 0.35], ['CodeEngin', 0.35], ['LabEngin', 0.30]],
};

// Fallback cold-start weights for any subsystem not in COLD_START_WEIGHTS.
const DEFAULT_COLD_START: [string, number][] = [
  ['CodeEngin', 0.35],
  ['LabEngin', 0.30],
  ['GameEngin', 0.20],
  ['ContentEngin', 0.15],
];

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
   * active subsystem.
   *
   * Before the engine has learned transitions from this subsystem, returns
   * cold-start defaults. Between MIN_TRANSITIONS and COLD_START_THRESHOLD,
   * blends cold-start defaults with learned weights. Above COLD_START_THRESHOLD,
   * uses purely learned weights.
   */
  predict(currentSubsystemId: string, topN = 3): PredictedNext[] {
    const transitionCount = Math.max(0, this.activationSequence.length - 1);
    const fromMap = this.transitions.get(currentSubsystemId);
    const hasLearned = fromMap !== undefined && fromMap.size > 0;

    // No learned data for this subsystem → pure cold-start.
    if (!hasLearned) {
      return this.coldStartPredictions(currentSubsystemId, topN);
    }

    const entries = Array.from(fromMap.entries());
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    let learnedNorm: { subsystemId: string; confidence: number }[];
    if (this.tfReady) {
      learnedNorm = this.normaliseWithTF(entries, total);
    } else {
      learnedNorm = entries.map(([subsystemId, count]) => ({
        subsystemId,
        confidence: count / total,
      }));
    }

    // Blend cold-start defaults with learned weights in the warm-up window.
    if (transitionCount <= COLD_START_THRESHOLD) {
      // Guard: if the two thresholds are equal (misconfiguration) treat as pure learned.
      const blendRange = COLD_START_THRESHOLD - MIN_TRANSITIONS;
      const learnWeight = blendRange > 0
        ? Math.max(0, transitionCount - MIN_TRANSITIONS) / blendRange
        : 1;
      const coldWeight = 1 - learnWeight;
      const coldDefaults = this.coldStartDefaults(currentSubsystemId);

      const learnedMap = new Map(learnedNorm.map((p) => [p.subsystemId, p.confidence]));
      const coldMap = new Map(coldDefaults.map(([id, conf]) => [id, conf]));

      const allIds = new Set([...learnedMap.keys(), ...coldMap.keys()]);
      const blended = Array.from(allIds).map((id) => ({
        subsystemId: id,
        confidence: learnWeight * (learnedMap.get(id) ?? 0) + coldWeight * (coldMap.get(id) ?? 0),
      }));

      return blended
        .filter((p) => p.confidence > 0)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, topN)
        .map(({ subsystemId, confidence }) => ({
          subsystemId,
          confidence,
          label: labelFor(subsystemId),
        }));
    }

    // Pure learned (transitionCount > COLD_START_THRESHOLD).
    return learnedNorm
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

  // ── Persistence ───────────────────────────────────────────────────────────

  /**
   * Exports the learned bigram transition matrix as a plain JSON-serialisable
   * object. Use together with importMatrix() to persist the engine across
   * browser sessions.
   */
  exportMatrix(): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {};
    for (const [from, toMap] of this.transitions) {
      result[from] = Object.fromEntries(toMap.entries());
    }
    return result;
  }

  /**
   * Restores the bigram transition matrix from a previously exported object.
   * Does not touch the activation sequence or seen-list — those remain
   * session-local.
   */
  importMatrix(data: Record<string, Record<string, number>>): void {
    this.transitions.clear();
    for (const [from, toObj] of Object.entries(data)) {
      if (typeof toObj !== 'object' || toObj === null) continue;
      const toMap = new Map<string, number>(
        Object.entries(toObj).filter(([, v]) => typeof v === 'number'),
      );
      if (toMap.size > 0) {
        this.transitions.set(from, toMap);
      }
    }
  }

  // ── Cold-start helpers ────────────────────────────────────────────────────

  private coldStartDefaults(subsystemId: string): [string, number][] {
    return COLD_START_WEIGHTS[subsystemId] ?? DEFAULT_COLD_START;
  }

  private coldStartPredictions(subsystemId: string, topN: number): PredictedNext[] {
    return this.coldStartDefaults(subsystemId)
      .slice(0, topN)
      .map(([id, confidence]) => ({
        subsystemId: id,
        confidence,
        label: labelFor(id),
      }));
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
