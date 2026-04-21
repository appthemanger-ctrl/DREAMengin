/**
 * lib/enginpipe/brain/index.ts
 *
 * Component 2 — File-Based Knowledge Brain
 *
 * The Brain is an in-memory, serialisable knowledge store that every Engin
 * agent uses to accumulate, rank, and retrieve:
 *
 *   • Principles   — non-negotiable rules drawn from GENERATION_LAW.md / LAW.md
 *   • Patterns     — learned code/behaviour templates with confidence scores
 *   • Sessions     — per-session event logs (what happened, in order)
 *   • Predictions  — ranked next-step proposals (weighted by torridity physics)
 *
 * Server-safe: pure TypeScript, no React, no DOM, no file-system I/O.
 * Persistence happens externally via `serializeBrain` / `hydrateBrain`.
 *
 * Spec: docs/enginpipe/README.md §2
 */

import { slog } from '@/lib/slog';
import { torridityRank, contentMass } from '@/lib/torridity';

// ─── Principle ────────────────────────────────────────────────────────────────

export type PrincipleCategory =
  | 'architecture'
  | 'naming'
  | 'behavior'
  | 'performance'
  | 'privacy'
  | 'security'
  | 'generation-law';

export interface Principle {
  readonly id: string;
  readonly category: PrincipleCategory;
  /** The binding statement of the principle. */
  readonly statement: string;
  /** Document or section where this principle originates. */
  readonly source: string;
  /** Priority weight 0–10 (10 = non-negotiable). */
  readonly priority: number;
}

// ─── Pattern ──────────────────────────────────────────────────────────────────

export type PatternKind =
  | 'component'
  | 'hook'
  | 'api'
  | 'test'
  | 'data'
  | 'workflow'
  | 'schema';

export interface Pattern {
  readonly id: string;
  readonly kind: PatternKind;
  readonly name: string;
  readonly description: string;
  /** Optional canonical example (code snippet or pseudocode). */
  readonly example?: string;
  /** Confidence score 0–1; increases with each successful use. */
  confidence: number;
  useCount: number;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export type SessionEventType =
  | 'observe'
  | 'generate'
  | 'validate'
  | 'error'
  | 'handoff'
  | 'deploy';

export interface SessionEvent {
  readonly type: SessionEventType;
  readonly timestamp: number;
  readonly payload: Record<string, unknown>;
}

export interface BrainSession {
  readonly sessionId: string;
  readonly enginId: string;
  readonly startedAt: number;
  endedAt?: number;
  active: boolean;
  readonly events: SessionEvent[];
}

// ─── Prediction ───────────────────────────────────────────────────────────────

export interface Prediction {
  readonly id: string;
  /** What condition/signal triggers this prediction. */
  readonly trigger: string;
  /** Recommended next action. */
  readonly action: string;
  /** Confidence 0–1. */
  confidence: number;
  /** Torridity-weighted score (updated by rankPredictions). */
  weight: number;
}

// ─── Brain snapshot ───────────────────────────────────────────────────────────

export interface BrainSnapshot {
  readonly version: 1;
  readonly principles: readonly Principle[];
  readonly patterns: readonly Pattern[];
  readonly predictions: readonly Omit<Prediction, 'id'>[];
  readonly exportedAt: number;
}

// ─── Core Brain interface ─────────────────────────────────────────────────────

export interface Brain {
  // Registry access (read-only views)
  readonly principles: ReadonlyMap<string, Principle>;
  readonly patterns: ReadonlyMap<string, Pattern>;
  readonly sessions: ReadonlyMap<string, BrainSession>;
  readonly predictions: readonly Prediction[];

  // Principle management
  addPrinciple(p: Omit<Principle, 'id'>): Principle;
  getPrinciple(id: string): Principle | undefined;
  getPrinciplesByCategory(category: PrincipleCategory): Principle[];

  // Pattern management
  addPattern(p: Omit<Pattern, 'id' | 'useCount'>): Pattern;
  usePattern(id: string): Pattern | undefined;
  getPatternsByKind(kind: PatternKind): Pattern[];

  // Session management
  startSession(enginId: string): BrainSession;
  endSession(sessionId: string): BrainSession | undefined;
  recordEvent(sessionId: string, event: Omit<SessionEvent, 'timestamp'>): void;
  getSession(sessionId: string): BrainSession | undefined;
  getActiveSessions(): BrainSession[];

  // Prediction engine
  addPrediction(p: Omit<Prediction, 'id'>): Prediction;
  rankPredictions(): Prediction[];
  topPredictions(n?: number): Prediction[];

  // Serialisation
  serialize(): BrainSnapshot;
}

// ─── createBrain factory ──────────────────────────────────────────────────────

let _nextId = 1;
function nextId(prefix: string): string {
  return `${prefix}-${(_nextId++).toString(36).padStart(4, '0')}`;
}

/**
 * Create a fresh Brain instance for an Engin agent.
 *
 * The returned object is mutable but all public collection accessors return
 * read-only views so external code cannot corrupt internal state.
 */
export function createBrain(): Brain {
  const principles = new Map<string, Principle>();
  const patterns   = new Map<string, Pattern>();
  const sessions   = new Map<string, BrainSession>();
  let   _predictions: Prediction[] = [];

  const brain: Brain = {
    // ── read-only views ──────────────────────────────────────────────────────
    get principles(): ReadonlyMap<string, Principle> { return principles; },
    get patterns():   ReadonlyMap<string, Pattern>   { return patterns;   },
    get sessions():   ReadonlyMap<string, BrainSession> { return sessions; },
    get predictions(): readonly Prediction[] { return _predictions; },

    // ── Principle management ─────────────────────────────────────────────────
    addPrinciple(p) {
      // Derive a stable ID from source + priority so loading snapshots is idempotent.
      const slug = p.source.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);
      const id   = `${slug}-${slog(p.priority).toFixed(2).replace('.', '_')}`;
      const principle: Principle = { id, ...p };
      principles.set(id, principle);
      return principle;
    },

    getPrinciple(id) { return principles.get(id); },

    getPrinciplesByCategory(category) {
      return [...principles.values()]
        .filter((p) => p.category === category)
        .sort((a, b) => b.priority - a.priority);
    },

    // ── Pattern management ───────────────────────────────────────────────────
    addPattern(p) {
      const id      = nextId('pat');
      const pattern: Pattern = { id, useCount: 0, ...p };
      patterns.set(id, pattern);
      return pattern;
    },

    usePattern(id) {
      const p = patterns.get(id);
      if (!p) return undefined;
      // Confidence converges to 1.0 via exponential smoothing on each use.
      p.useCount  += 1;
      p.confidence = Math.min(1, p.confidence + (1 - p.confidence) * 0.1);
      return p;
    },

    getPatternsByKind(kind) {
      return [...patterns.values()]
        .filter((p) => p.kind === kind)
        .sort((a, b) => b.confidence - a.confidence);
    },

    // ── Session management ───────────────────────────────────────────────────
    startSession(enginId) {
      const session: BrainSession = {
        sessionId: nextId('sess'),
        enginId,
        startedAt: Date.now(),
        active: true,
        events: [],
      };
      sessions.set(session.sessionId, session);
      return session;
    },

    endSession(sessionId) {
      const s = sessions.get(sessionId);
      if (!s) return undefined;
      s.active  = false;
      s.endedAt = Date.now();
      return s;
    },

    recordEvent(sessionId, event) {
      const s = sessions.get(sessionId);
      if (!s?.active) return;
      (s.events as SessionEvent[]).push({ ...event, timestamp: Date.now() });
    },

    getSession(sessionId) { return sessions.get(sessionId); },

    getActiveSessions() {
      return [...sessions.values()].filter((s) => s.active);
    },

    // ── Prediction engine ────────────────────────────────────────────────────
    addPrediction(p) {
      const pred: Prediction = { id: nextId('pred'), ...p };
      _predictions.push(pred);
      return pred;
    },

    rankPredictions() {
      // Use torridity physics to score predictions:
      //   views        = round(confidence × 100)
      //   buildTime    = action length in chars (effort proxy)
      //   uniqueAssets = 1 per word in the trigger (relevance breadth)
      _predictions = _predictions.map((pred) => {
        const views       = Math.round(pred.confidence * 100);
        const buildTime   = pred.action.length;
        const uniqueAssets = pred.trigger.split(/\s+/).length;
        const mass        = contentMass(buildTime, uniqueAssets);
        const rank        = torridityRank(views, mass);
        return { ...pred, weight: rank };
      }).sort((a, b) => b.weight - a.weight);

      return _predictions;
    },

    topPredictions(n = 5) {
      return brain.rankPredictions().slice(0, n);
    },

    // ── Serialisation ────────────────────────────────────────────────────────
    serialize() {
      return {
        version: 1 as const,
        principles: [...principles.values()],
        patterns:   [...patterns.values()],
        predictions: _predictions.map(({ id: _id, ...rest }) => rest),
        exportedAt:  Date.now(),
      };
    },
  };

  return brain;
}

// ─── hydrateBrain ─────────────────────────────────────────────────────────────

/**
 * Restore a Brain from a previously serialised snapshot.
 * Returns a fully-functional Brain that can continue accumulating state.
 */
export function hydrateBrain(snapshot: BrainSnapshot): Brain {
  const brain = createBrain();

  for (const p of snapshot.principles) {
    const { id: _id, ...rest } = p;
    brain.addPrinciple(rest);
  }
  for (const p of snapshot.patterns) {
    const { id: _id, useCount, ...rest } = p;
    const pat = brain.addPattern(rest);
    for (let i = 0; i < useCount; i++) brain.usePattern(pat.id);
  }
  for (const p of snapshot.predictions) {
    brain.addPrediction(p);
  }

  return brain;
}

// ─── Built-in DREAMengin principles ──────────────────────────────────────────

/**
 * Seed a Brain with the canonical DREAMengin principles sourced from
 * GENERATION_LAW.md and LAW.md.
 *
 * Call once after `createBrain()` to give any Engin agent a principled
 * starting point without requiring a network request or file read.
 */
export function seedDefaultPrinciples(brain: Brain): void {
  const defaults: readonly Omit<Principle, 'id'>[] = [
    {
      category:  'architecture',
      statement: 'Logic lives in lib/; data access is not allowed in Surface (app/) or Component files.',
      source:    'GENERATION_LAW.md §3.1',
      priority:  10,
    },
    {
      category:  'naming',
      statement: 'Use engin.*, dream.*, dreamsurface.* prefixes; never invent new surface/route names.',
      source:    'GENERATION_LAW.md §3.2',
      priority:  10,
    },
    {
      category:  'behavior',
      statement: 'Every visible action does something real. No stubs, no href="#".',
      source:    'GENERATION_LAW.md §3.4',
      priority:  10,
    },
    {
      category:  'privacy',
      statement: 'RLS everywhere; no secrets to the browser; private by default.',
      source:    'GENERATION_LAW.md §3.5',
      priority:  10,
    },
    {
      category:  'performance',
      statement: 'Components render on demand; ≥ 60 fps interactive / ≥ 30 fps passive.',
      source:    'GENERATION_LAW.md §3.6',
      priority:  9,
    },
    {
      category:  'security',
      statement: 'Least privilege; service_role only where strictly required.',
      source:    'CONSTITUTION.md §4',
      priority:  10,
    },
    {
      category:  'generation-law',
      statement: 'Compute ι before every generation pass; ι < 2.88 → FLOW; ≥ 9.59 → MANIFEST.',
      source:    'GENERATION_LAW.md §2',
      priority:  9,
    },
    {
      category:  'behavior',
      statement: 'Nothing is public by default. Visibility is explicit and auditable.',
      source:    'LAW.md §2',
      priority:  10,
    },
  ];

  for (const p of defaults) brain.addPrinciple(p);
}
