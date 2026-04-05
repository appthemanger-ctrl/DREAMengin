/**
 * tests/forge-build.test.ts
 *
 * Vitest tests for the ForgeEngin AI Anything Builder.
 * Covers: types, localStorage helpers, rate-limit logic, type guard,
 *         hook exports, component export, and API route existence.
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
  type ForgeBuildRecord,
  type ForgeLogEvent,
  type ForgeBuildState,
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
    const event: unknown = { type: 'file', path: 'games/init-output', action: 'created', ts: Date.now() };
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
});

// ── ForgeLogEvent discriminated union ────────────────────────────────────────

describe('ForgeLogEvent discriminated union exhaustiveness', () => {
  it('all 6 event types are represented', () => {
    const types: ForgeLogEvent['type'][] = ['agent', 'step', 'file', 'result', 'error', 'done'];
    expect(types).toHaveLength(6);
  });

  it('agent event has correct shape', () => {
    const e: ForgeLogEvent = { type: 'agent', agent: 'Dr. Eams', message: 'Creative plan', ts: 0 };
    expect(e.type).toBe('agent');
    if (e.type === 'agent') {
      expect(e.message).toBe('Creative plan');
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
  });
});
