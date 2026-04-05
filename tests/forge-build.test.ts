/**
 * tests/forge-build.test.ts
 *
 * Vitest tests for the ForgeEngin AI Anything Builder.
 * Covers: types, localStorage helpers, rate-limit logic, type guard,
 *         ForgeArtifact types, stageForgeArtifact, hook exports,
 *         component export, and API route existence.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs';

// ── Mock localStorage (node environment — no browser globals) ────────────────
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};
vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('window', { localStorage: localStorageMock });

// Now import after global stubs are in place
import {
  saveForgeBuild,
  readForgeBuilds,
  clearForgeBuilds,
  canBuildToday,
  recordBuildToday,
  isForgeLogEvent,
  stageForgeArtifact,
  type ForgeBuildRecord,
  type ForgeLogEvent,
  type ForgeBuildState,
  type ForgeArtifact,
  type ForgeArtifactType,
} from '@/lib/forge/forgeBuild';

// ── Helper: minimal valid ForgeBuildRecord ───────────────────────────────────
function makeBuildRecord(overrides: Partial<ForgeBuildRecord> = {}): ForgeBuildRecord {
  return {
    id: 'test-id-123',
    prompt: 'Build me a desert platformer game',
    logs: [],
    primaryHref: '/daydream/games',
    primaryEnginId: 'games',
    createdAt: new Date().toISOString(),
    summary: 'Generated GameEngin level for desert platformer',
    ...overrides,
  };
}

// ── Helper: minimal valid ForgeArtifact ──────────────────────────────────────
function makeArtifact(overrides: Partial<ForgeArtifact> = {}): ForgeArtifact {
  return {
    type: 'code-cells',
    enginId: 'code',
    filename: 'notebooks/test_script.ts',
    content: 'const x: number = 42;',
    language: 'typescript',
    ...overrides,
  };
}

// ── ForgeBuildRecord type shape ───────────────────────────────────────────────

describe('ForgeBuildRecord type shape', () => {
  it('has all required fields', () => {
    const rec = makeBuildRecord();
    expect(rec).toHaveProperty('id');
    expect(rec).toHaveProperty('prompt');
    expect(rec).toHaveProperty('logs');
    expect(rec).toHaveProperty('primaryHref');
    expect(rec).toHaveProperty('primaryEnginId');
    expect(rec).toHaveProperty('createdAt');
    expect(rec).toHaveProperty('summary');
  });

  it('logs is an array', () => {
    const rec = makeBuildRecord();
    expect(Array.isArray(rec.logs)).toBe(true);
  });

  it('ForgeBuildState accepts all valid literals', () => {
    const states: ForgeBuildState[] = ['idle', 'running', 'done', 'error'];
    expect(states).toHaveLength(4);
  });

  it('artifact field is optional', () => {
    const recWithout = makeBuildRecord();
    expect(recWithout.artifact).toBeUndefined();

    const artifact = makeArtifact();
    const recWith = makeBuildRecord({ artifact });
    expect(recWith.artifact).toBeDefined();
    expect(recWith.artifact?.type).toBe('code-cells');
  });
});

// ── ForgeArtifact type shape ──────────────────────────────────────────────────

describe('ForgeArtifact type shape', () => {
  it('has all required fields', () => {
    const a = makeArtifact();
    expect(a).toHaveProperty('type');
    expect(a).toHaveProperty('enginId');
    expect(a).toHaveProperty('filename');
    expect(a).toHaveProperty('content');
    expect(a).toHaveProperty('language');
  });

  it('accepts all valid ForgeArtifactType values', () => {
    const types: ForgeArtifactType[] = [
      'code-cells',
      'game-level',
      'midi-pattern',
      'brand-palette',
      'lab-config',
      'content-draft',
    ];
    expect(types).toHaveLength(6);
    for (const type of types) {
      const a = makeArtifact({ type });
      expect(a.type).toBe(type);
    }
  });

  it('code-cells artifact has typescript language', () => {
    const a = makeArtifact({ type: 'code-cells', language: 'typescript' });
    expect(a.language).toBe('typescript');
  });

  it('game-level artifact has json language', () => {
    const a = makeArtifact({ type: 'game-level', language: 'json', enginId: 'games' });
    expect(a.language).toBe('json');
    expect(a.enginId).toBe('games');
  });

  it('midi-pattern artifact has json language', () => {
    const a = makeArtifact({ type: 'midi-pattern', language: 'json', enginId: 'music' });
    expect(a.enginId).toBe('music');
  });

  it('lab-config artifact has python language', () => {
    const a = makeArtifact({ type: 'lab-config', language: 'python', enginId: 'lab' });
    expect(a.language).toBe('python');
  });

  it('content-draft artifact has markdown language', () => {
    const a = makeArtifact({ type: 'content-draft', language: 'markdown', enginId: 'create' });
    expect(a.language).toBe('markdown');
  });
});

// ── stageForgeArtifact ────────────────────────────────────────────────────────

describe('stageForgeArtifact', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('prepends a NotebookCell to de-codegen-cells for code-cells type', () => {
    const existing = [{ id: 'old-cell-1', language: 'python', source: 'print("hello")' }];
    store['de-codegen-cells'] = JSON.stringify(existing);

    stageForgeArtifact(makeArtifact({
      type: 'code-cells',
      language: 'typescript',
      content: 'const x: number = 42;',
    }));

    const stored = JSON.parse(store['de-codegen-cells']) as Array<{ id: string; language: string; source: string }>;
    expect(stored).toHaveLength(2);
    expect(stored[0].source).toBe('const x: number = 42;');
    expect(stored[0].language).toBe('typescript');
    expect(typeof stored[0].id).toBe('string');
    expect(stored[0].id.length).toBeGreaterThan(0);
    // Existing cell preserved
    expect(stored[1].id).toBe('old-cell-1');
  });

  it('creates de-codegen-cells from scratch when not present', () => {
    stageForgeArtifact(makeArtifact({ type: 'code-cells', content: 'let y = 1;', language: 'typescript' }));
    const stored = JSON.parse(store['de-codegen-cells']) as unknown[];
    expect(stored).toHaveLength(1);
    expect((stored[0] as { source: string }).source).toBe('let y = 1;');
  });

  it('writes game-level artifact to de:forge:staged-level', () => {
    const artifact = makeArtifact({ type: 'game-level', enginId: 'games', language: 'json', content: '{"scene":"desert"}' });
    stageForgeArtifact(artifact);
    expect(store['de:forge:staged-level']).toBeDefined();
    const parsed = JSON.parse(store['de:forge:staged-level']) as ForgeArtifact;
    expect(parsed.type).toBe('game-level');
    expect(parsed.content).toBe('{"scene":"desert"}');
  });

  it('writes midi-pattern artifact to de:forge:staged-track', () => {
    const artifact = makeArtifact({ type: 'midi-pattern', enginId: 'music', language: 'json', content: '{"bpm":88}' });
    stageForgeArtifact(artifact);
    const parsed = JSON.parse(store['de:forge:staged-track']) as ForgeArtifact;
    expect(parsed.type).toBe('midi-pattern');
  });

  it('writes brand-palette artifact to de:forge:staged-palette', () => {
    const artifact = makeArtifact({ type: 'brand-palette', enginId: 'brand', language: 'json', content: '{"primary":"#fff"}' });
    stageForgeArtifact(artifact);
    const parsed = JSON.parse(store['de:forge:staged-palette']) as ForgeArtifact;
    expect(parsed.type).toBe('brand-palette');
  });

  it('writes lab-config artifact to de:forge:staged-lab', () => {
    const artifact = makeArtifact({ type: 'lab-config', enginId: 'lab', language: 'python', content: 'import numpy' });
    stageForgeArtifact(artifact);
    const parsed = JSON.parse(store['de:forge:staged-lab']) as ForgeArtifact;
    expect(parsed.type).toBe('lab-config');
  });

  it('writes content-draft artifact to de:forge:staged-draft', () => {
    const artifact = makeArtifact({ type: 'content-draft', enginId: 'create', language: 'markdown', content: '# Draft' });
    stageForgeArtifact(artifact);
    const parsed = JSON.parse(store['de:forge:staged-draft']) as ForgeArtifact;
    expect(parsed.type).toBe('content-draft');
  });

  it('is safe to call in SSR (window undefined) — no-op', () => {
    // Simulate SSR: temporarily hide window
    const savedWindow = globalThis.window;
    // @ts-expect-error - testing SSR condition
    delete globalThis.window;
    expect(() => stageForgeArtifact(makeArtifact())).not.toThrow();
    globalThis.window = savedWindow;
  });
});

// ── saveForgeBuild / readForgeBuilds ─────────────────────────────────────────

describe('saveForgeBuild / readForgeBuilds', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('saves a build record', () => {
    const rec = makeBuildRecord({ id: 'build-1' });
    saveForgeBuild(rec);
    const all = readForgeBuilds();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('build-1');
  });

  it('prepends newer builds (newest first)', () => {
    saveForgeBuild(makeBuildRecord({ id: 'build-1' }));
    saveForgeBuild(makeBuildRecord({ id: 'build-2' }));
    const all = readForgeBuilds();
    expect(all[0].id).toBe('build-2');
    expect(all[1].id).toBe('build-1');
  });

  it('keeps at most 10 builds', () => {
    for (let i = 0; i < 15; i++) {
      saveForgeBuild(makeBuildRecord({ id: `build-${i}` }));
    }
    const all = readForgeBuilds();
    expect(all).toHaveLength(10);
  });

  it('returns empty array when nothing stored', () => {
    const all = readForgeBuilds();
    expect(all).toEqual([]);
  });

  it('handles invalid JSON gracefully', () => {
    store['de:forge:builds'] = 'not-json{{{{';
    const all = readForgeBuilds();
    expect(all).toEqual([]);
  });

  it('persists the artifact field on a build record', () => {
    const artifact = makeArtifact({ type: 'game-level', enginId: 'games' });
    saveForgeBuild(makeBuildRecord({ id: 'with-artifact', artifact }));
    const all = readForgeBuilds();
    expect(all[0].artifact?.type).toBe('game-level');
    expect(all[0].artifact?.enginId).toBe('games');
  });
});

// ── clearForgeBuilds ──────────────────────────────────────────────────────────

describe('clearForgeBuilds', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('removes all stored builds', () => {
    saveForgeBuild(makeBuildRecord({ id: 'build-1' }));
    saveForgeBuild(makeBuildRecord({ id: 'build-2' }));
    clearForgeBuilds();
    expect(readForgeBuilds()).toEqual([]);
  });

  it('is safe to call when no builds stored', () => {
    expect(() => clearForgeBuilds()).not.toThrow();
  });
});

// ── canBuildToday / recordBuildToday ─────────────────────────────────────────

describe('canBuildToday / recordBuildToday', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('returns true when no stamp exists', () => {
    expect(canBuildToday()).toBe(true);
  });

  it('returns false after recordBuildToday is called', () => {
    recordBuildToday();
    expect(canBuildToday()).toBe(false);
  });

  it('returns true when stamp is a different day', () => {
    store['de:forge:build:last-date'] = 'Mon Jan 01 2000';
    expect(canBuildToday()).toBe(true);
  });

  it('returns false when stamp matches today', () => {
    store['de:forge:build:last-date'] = new Date().toDateString();
    expect(canBuildToday()).toBe(false);
  });

  it('stamps todays date string', () => {
    recordBuildToday();
    expect(store['de:forge:build:last-date']).toBe(new Date().toDateString());
  });
});

// ── isForgeLogEvent type guard ────────────────────────────────────────────────

describe('isForgeLogEvent type guard', () => {
  it('accepts valid agent event', () => {
    const event: unknown = { type: 'agent', agent: 'Dr. Eams', message: 'Hello', ts: Date.now() };
    expect(isForgeLogEvent(event)).toBe(true);
  });

  it('accepts valid step event', () => {
    const event: unknown = { type: 'step', step: 'Running task', ts: Date.now() };
    expect(isForgeLogEvent(event)).toBe(true);
  });

  it('accepts valid file event', () => {
    const event: unknown = { type: 'file', path: 'notebooks/test.ts', action: 'created', ts: Date.now() };
    expect(isForgeLogEvent(event)).toBe(true);
  });

  it('accepts valid result event', () => {
    const event: unknown = {
      type: 'result',
      enginId: 'games',
      href: '/daydream/games',
      summary: 'Built a game',
      ts: Date.now(),
    };
    expect(isForgeLogEvent(event)).toBe(true);
  });

  it('accepts valid error event', () => {
    const event: unknown = { type: 'error', message: 'Something went wrong', ts: Date.now() };
    expect(isForgeLogEvent(event)).toBe(true);
  });

  it('accepts valid done event', () => {
    const event: unknown = { type: 'done', ts: Date.now() };
    expect(isForgeLogEvent(event)).toBe(true);
  });

  it('accepts valid code event', () => {
    const event: unknown = {
      type: 'code',
      language: 'typescript',
      filename: 'notebooks/ForgeScript_123.ts',
      content: 'const x = 1;',
      ts: Date.now(),
    };
    expect(isForgeLogEvent(event)).toBe(true);
  });

  it('accepts code event with json language', () => {
    const event: unknown = {
      type: 'code',
      language: 'json',
      filename: 'scenes/ForgeLevel_123.json',
      content: '{"scene":"desert"}',
      ts: Date.now(),
    };
    expect(isForgeLogEvent(event)).toBe(true);
  });

  it('accepts code event with python language', () => {
    const event: unknown = {
      type: 'code',
      language: 'python',
      filename: 'experiments/test.py',
      content: 'import random',
      ts: Date.now(),
    };
    expect(isForgeLogEvent(event)).toBe(true);
  });

  it('accepts code event with markdown language', () => {
    const event: unknown = {
      type: 'code',
      language: 'markdown',
      filename: 'content/draft.md',
      content: '# Hello',
      ts: Date.now(),
    };
    expect(isForgeLogEvent(event)).toBe(true);
  });

  it('rejects code event missing filename', () => {
    const event: unknown = { type: 'code', language: 'typescript', content: 'x', ts: Date.now() };
    expect(isForgeLogEvent(event)).toBe(false);
  });

  it('rejects code event missing content', () => {
    const event: unknown = { type: 'code', language: 'typescript', filename: 'test.ts', ts: Date.now() };
    expect(isForgeLogEvent(event)).toBe(false);
  });

  it('rejects code event missing language', () => {
    const event: unknown = { type: 'code', filename: 'test.ts', content: 'x', ts: Date.now() };
    expect(isForgeLogEvent(event)).toBe(false);
  });

  it('rejects null', () => {
    expect(isForgeLogEvent(null)).toBe(false);
  });

  it('rejects missing type', () => {
    expect(isForgeLogEvent({ ts: Date.now() })).toBe(false);
  });

  it('rejects unknown type', () => {
    expect(isForgeLogEvent({ type: 'unknown', ts: Date.now() })).toBe(false);
  });

  it('rejects agent event with invalid agent name', () => {
    const event: unknown = { type: 'agent', agent: 'SomeRandomAI', message: 'hi', ts: Date.now() };
    expect(isForgeLogEvent(event)).toBe(false);
  });

  it('rejects file event with invalid action', () => {
    const event: unknown = { type: 'file', path: 'x/y', action: 'deleted', ts: Date.now() };
    expect(isForgeLogEvent(event)).toBe(false);
  });

  it('accepts all three valid agent names', () => {
    const agents = ['Dr. Eams', 'IDARi', 'TheBoogieMan.Ai'] as const;
    for (const agent of agents) {
      expect(isForgeLogEvent({ type: 'agent', agent, message: 'test', ts: 0 })).toBe(true);
    }
  });

  it('accepts PHASE: step events', () => {
    const phaseSteps = [
      'PHASE: Parsing your request...',
      'PHASE: Dr. Eams is thinking creatively...',
      'PHASE: IDARi is architecting the solution...',
      'PHASE: TheBoogieMan.Ai is checking policy...',
      'PHASE: Generating artifact...',
      'PHASE: Staging to GameEngin...',
      'PHASE: Build complete! 🎉',
    ];
    for (const step of phaseSteps) {
      expect(isForgeLogEvent({ type: 'step', step, ts: Date.now() })).toBe(true);
    }
  });
});

// ── ForgeLogEvent discriminated union ────────────────────────────────────────

describe('ForgeLogEvent discriminated union exhaustiveness', () => {
  it('all 7 event types are represented', () => {
    const types: ForgeLogEvent['type'][] = ['agent', 'step', 'file', 'result', 'error', 'done', 'code'];
    expect(types).toHaveLength(7);
  });

  it('agent event has correct shape', () => {
    const e: ForgeLogEvent = { type: 'agent', agent: 'Dr. Eams', message: 'Creative plan', ts: 0 };
    expect(e.type).toBe('agent');
    if (e.type === 'agent') {
      expect(e.message).toBe('Creative plan');
    }
  });

  it('code event has correct shape', () => {
    const e: ForgeLogEvent = {
      type: 'code',
      language: 'typescript',
      filename: 'notebooks/ForgeScript.ts',
      content: 'const x = 1;',
      ts: 0,
    };
    expect(e.type).toBe('code');
    if (e.type === 'code') {
      expect(e.language).toBe('typescript');
      expect(e.filename).toBe('notebooks/ForgeScript.ts');
      expect(e.content).toBe('const x = 1;');
    }
  });

  it('step event can carry PHASE prefix', () => {
    const e: ForgeLogEvent = { type: 'step', step: 'PHASE: Generating artifact...', ts: 0 };
    expect(e.type).toBe('step');
    if (e.type === 'step') {
      expect(e.step.startsWith('PHASE:')).toBe(true);
    }
  });
});

// ── AIBuilderPanel default export existence ───────────────────────────────────

describe('AIBuilderPanel', () => {
  it('default export exists at expected path', async () => {
    const panelPath = path.resolve(__dirname, '../components/forge/AIBuilderPanel.tsx');
    expect(fs.existsSync(panelPath)).toBe(true);
  });

  it('file contains "use client" directive', () => {
    const panelPath = path.resolve(__dirname, '../components/forge/AIBuilderPanel.tsx');
    const content = fs.readFileSync(panelPath, 'utf-8');
    expect(content).toContain("'use client'");
  });

  it('exports a default function component', () => {
    const panelPath = path.resolve(__dirname, '../components/forge/AIBuilderPanel.tsx');
    const content = fs.readFileSync(panelPath, 'utf-8');
    expect(content).toContain('export default function AIBuilderPanel');
  });

  it('contains phase progress bar', () => {
    const panelPath = path.resolve(__dirname, '../components/forge/AIBuilderPanel.tsx');
    const content = fs.readFileSync(panelPath, 'utf-8');
    expect(content).toContain('PhaseBar');
    expect(content).toContain('PHASES');
  });

  it('contains code block renderer', () => {
    const panelPath = path.resolve(__dirname, '../components/forge/AIBuilderPanel.tsx');
    const content = fs.readFileSync(panelPath, 'utf-8');
    expect(content).toContain('CodeBlock');
    expect(content).toContain('CodeLogEvent');
  });

  it('contains example chips', () => {
    const panelPath = path.resolve(__dirname, '../components/forge/AIBuilderPanel.tsx');
    const content = fs.readFileSync(panelPath, 'utf-8');
    expect(content).toContain('EXAMPLE_CHIPS');
  });

  it('contains character counter', () => {
    const panelPath = path.resolve(__dirname, '../components/forge/AIBuilderPanel.tsx');
    const content = fs.readFileSync(panelPath, 'utf-8');
    expect(content).toContain('charCount');
  });
});

// ── useForgeBuild hook exports ────────────────────────────────────────────────

describe('useForgeBuild hook', () => {
  it('hook file exists at expected path', () => {
    const hookPath = path.resolve(__dirname, '../lib/forge/useForgeBuild.ts');
    expect(fs.existsSync(hookPath)).toBe(true);
  });

  it('exports useForgeBuild function', () => {
    const hookPath = path.resolve(__dirname, '../lib/forge/useForgeBuild.ts');
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content).toContain('export function useForgeBuild');
  });

  it('hook file has use client directive', () => {
    const hookPath = path.resolve(__dirname, '../lib/forge/useForgeBuild.ts');
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content).toContain("'use client'");
  });

  it('hook handles code events and stages artifacts', () => {
    const hookPath = path.resolve(__dirname, '../lib/forge/useForgeBuild.ts');
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content).toContain('stageForgeArtifact');
    expect(content).toContain('pendingCodeEvent');
    expect(content).toContain('buildArtifact');
    expect(content).toContain('ARTIFACT_TYPE_MAP');
  });
});

// ── API route file existence ──────────────────────────────────────────────────

describe('API route /api/forge/build', () => {
  it('route file exists at app/api/forge/build/route.ts', () => {
    const routePath = path.resolve(__dirname, '../app/api/forge/build/route.ts');
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('route file does NOT have "use client" directive', () => {
    const routePath = path.resolve(__dirname, '../app/api/forge/build/route.ts');
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).not.toContain("'use client'");
    expect(content).not.toContain('"use client"');
  });

  it('route file exports a POST handler', () => {
    const routePath = path.resolve(__dirname, '../app/api/forge/build/route.ts');
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('export async function POST');
  });

  it('route returns SSE content type', () => {
    const routePath = path.resolve(__dirname, '../app/api/forge/build/route.ts');
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('text/event-stream');
  });

  it('route emits PHASE step events', () => {
    const routePath = path.resolve(__dirname, '../app/api/forge/build/route.ts');
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('PHASE: Parsing');
    expect(content).toContain('PHASE: Dr. Eams');
    expect(content).toContain('PHASE: IDARi is architecting');
    expect(content).toContain('PHASE: TheBoogieMan');
    expect(content).toContain('PHASE: Generating');
    expect(content).toContain('PHASE: Staging');
    expect(content).toContain('PHASE: Build complete');
  });

  it('route emits code events', () => {
    const routePath = path.resolve(__dirname, '../app/api/forge/build/route.ts');
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("type: 'code'");
  });

  it('route has simulation mode with rich content', () => {
    const routePath = path.resolve(__dirname, '../app/api/forge/build/route.ts');
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('buildSimulation');
    expect(content).toContain('idariMessage');
    expect(content).toContain('artifactContent');
  });

  it('route has 4-round AI pipeline', () => {
    const routePath = path.resolve(__dirname, '../app/api/forge/build/route.ts');
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('callEams');
    expect(content).toContain('callIdari');
    expect(content).toContain('callBoogie');
    expect(content).toContain('callGenerate');
  });
});

// ── forgeBuild.ts lib file ────────────────────────────────────────────────────

describe('forgeBuild lib module', () => {
  it('lib file exists', () => {
    const libPath = path.resolve(__dirname, '../lib/forge/forgeBuild.ts');
    expect(fs.existsSync(libPath)).toBe(true);
  });

  it('exports all required functions', () => {
    const libPath = path.resolve(__dirname, '../lib/forge/forgeBuild.ts');
    const content = fs.readFileSync(libPath, 'utf-8');
    expect(content).toContain('export function saveForgeBuild');
    expect(content).toContain('export function readForgeBuilds');
    expect(content).toContain('export function clearForgeBuilds');
    expect(content).toContain('export function canBuildToday');
    expect(content).toContain('export function recordBuildToday');
    expect(content).toContain('export function isForgeLogEvent');
    expect(content).toContain('export function stageForgeArtifact');
  });

  it('exports ForgeArtifact and ForgeArtifactType', () => {
    const libPath = path.resolve(__dirname, '../lib/forge/forgeBuild.ts');
    const content = fs.readFileSync(libPath, 'utf-8');
    expect(content).toContain('export interface ForgeArtifact');
    expect(content).toContain('export type ForgeArtifactType');
  });

  it('ForgeLogEvent includes code variant', () => {
    const libPath = path.resolve(__dirname, '../lib/forge/forgeBuild.ts');
    const content = fs.readFileSync(libPath, 'utf-8');
    expect(content).toContain("type: 'code'");
  });
});

