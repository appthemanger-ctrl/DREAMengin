/**
 * lib/forge/forgeBuild.ts
 *
 * Types and localStorage utilities for the ForgeEngin AI Anything Builder.
 * All persistence is localStorage-only — no new Supabase tables.
 *
 * Architecture: follows the forgeRegistry.ts pattern (localStorage + SSR guard).
 */

import { v4 as uuidv4 } from 'uuid';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ForgeBuildState = 'idle' | 'running' | 'done' | 'error';

/**
 * Engin-specific artifact type — written to localStorage for the Engin to pick up.
 */
export type ForgeArtifactType =
  | 'code-cells'
  | 'game-level'
  | 'midi-pattern'
  | 'brand-palette'
  | 'lab-config'
  | 'content-draft';

/**
 * A generated artifact that is staged into an Engin's localStorage slot.
 */
export interface ForgeArtifact {
  /** Determines which localStorage key the artifact is staged to */
  type: ForgeArtifactType;
  /** Canonical engin id, e.g. 'games', 'code' */
  enginId: string;
  /** Human-readable filename, e.g. 'notebooks/weather_analysis.py' */
  filename: string;
  /** The actual generated content (code, JSON, markdown, etc.) */
  content: string;
  /** MIME-style language tag, e.g. 'typescript' | 'python' | 'json' | 'markdown' */
  language: string;
}

/**
 * Discriminated union of all events streamed from /api/forge/build.
 * Each event carries a `ts` (Unix ms) for display.
 */
export type ForgeLogEvent =
  | { type: 'agent'; agent: 'Dr. Eams' | 'IDARi' | 'TheBoogieMan.Ai'; message: string; ts: number }
  | { type: 'step'; step: string; ts: number }
  | { type: 'file'; path: string; action: 'created' | 'modified'; ts: number }
  | { type: 'result'; enginId: string; href: string; summary: string; ts: number }
  | { type: 'error'; message: string; ts: number }
  | { type: 'done'; ts: number }
  | { type: 'code'; language: string; filename: string; content: string; ts: number };

/**
 * A completed (or in-progress) build record stored in localStorage.
 */
export interface ForgeBuildRecord {
  id: string;
  prompt: string;
  logs: ForgeLogEvent[];
  primaryHref: string;
  primaryEnginId: string;
  createdAt: string;
  summary: string;
  /** Generated artifact staged into the target Engin's localStorage slot */
  artifact?: ForgeArtifact;
}

// ── Storage keys ───────────────────────────────────────────────────────────────

const BUILDS_KEY = 'de:forge:builds';
const RATE_KEY = 'de:forge:build:last-date';
const MAX_BUILDS = 10;

// ── Type guard utility ─────────────────────────────────────────────────────────

/**
 * Type guard: narrow an unknown value to ForgeLogEvent.
 * Useful in parsers and tests.
 */
export function isForgeLogEvent(value: unknown): value is ForgeLogEvent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.type !== 'string') return false;
  if (typeof v.ts !== 'number') return false;
  switch (v.type) {
    case 'agent':
      return (
        (v.agent === 'Dr. Eams' || v.agent === 'IDARi' || v.agent === 'TheBoogieMan.Ai') &&
        typeof v.message === 'string'
      );
    case 'step':
      return typeof v.step === 'string';
    case 'file':
      return typeof v.path === 'string' && (v.action === 'created' || v.action === 'modified');
    case 'result':
      return (
        typeof v.enginId === 'string' &&
        typeof v.href === 'string' &&
        typeof v.summary === 'string'
      );
    case 'error':
      return typeof v.message === 'string';
    case 'done':
      return true;
    case 'code':
      return (
        typeof v.language === 'string' &&
        typeof v.filename === 'string' &&
        typeof v.content === 'string'
      );
    default:
      return false;
  }
}

// ── Build persistence ──────────────────────────────────────────────────────────

/**
 * Persist a build record to localStorage (keep last MAX_BUILDS).
 */
export function saveForgeBuild(record: ForgeBuildRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = readForgeBuilds();
    const updated = [record, ...existing].slice(0, MAX_BUILDS);
    localStorage.setItem(BUILDS_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable — silent
  }
}

/**
 * Read all stored build records from localStorage.
 */
export function readForgeBuilds(): ForgeBuildRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BUILDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ForgeBuildRecord[];
  } catch {
    return [];
  }
}

/**
 * Remove all stored build records.
 */
export function clearForgeBuilds(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(BUILDS_KEY);
  } catch {
    // silent
  }
}

// ── Daily rate-limit ───────────────────────────────────────────────────────────

/**
 * Returns true when the user has NOT yet built today.
 * Uses `new Date().toDateString()` as the day key — locale-stable.
 */
export function canBuildToday(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const last = localStorage.getItem(RATE_KEY);
    if (!last) return true;
    return last !== new Date().toDateString();
  } catch {
    return true;
  }
}

/**
 * Stamp today's date so `canBuildToday()` returns false for the rest of the day.
 */
export function recordBuildToday(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RATE_KEY, new Date().toDateString());
  } catch {
    // silent
  }
}

// ── Artifact staging ───────────────────────────────────────────────────────────

/** Minimal notebook cell shape matching CodeEngin's de-codegen-cells format */
interface NotebookCell {
  id: string;
  language: string;
  source: string;
}

/**
 * Stage a generated artifact into the target Engin's localStorage slot.
 *
 * - `code-cells`    → prepends a NotebookCell to `de-codegen-cells` (CodeEngin)
 * - `game-level`    → writes to `de:forge:staged-level`
 * - `midi-pattern`  → writes to `de:forge:staged-track`
 * - `brand-palette` → writes to `de:forge:staged-palette`
 * - `lab-config`    → writes to `de:forge:staged-lab`
 * - `content-draft` → writes to `de:forge:staged-draft`
 */
export function stageForgeArtifact(artifact: ForgeArtifact): void {
  if (typeof window === 'undefined') return;
  try {
    if (artifact.type === 'code-cells') {
      const raw = localStorage.getItem('de-codegen-cells');
      const existing: NotebookCell[] = raw ? (JSON.parse(raw) as NotebookCell[]) : [];
      const newCell: NotebookCell = {
        id: uuidv4(),
        language: artifact.language,
        source: artifact.content,
      };
      localStorage.setItem('de-codegen-cells', JSON.stringify([newCell, ...existing]));
    } else {
      const keyMap: Record<ForgeArtifactType, string> = {
        'code-cells': 'de-codegen-cells',
        'game-level': 'de:forge:staged-level',
        'midi-pattern': 'de:forge:staged-track',
        'brand-palette': 'de:forge:staged-palette',
        'lab-config': 'de:forge:staged-lab',
        'content-draft': 'de:forge:staged-draft',
      };
      const key = keyMap[artifact.type];
      if (key) {
        localStorage.setItem(key, JSON.stringify(artifact));
      }
    }
  } catch {
    // localStorage unavailable — silent
  }
}
