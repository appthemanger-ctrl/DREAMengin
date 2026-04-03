/**
 * ForgeEngin Tests
 *
 * Tests for the ForgeEngin meta-creation engine registry, activity pulse system,
 * and integration wiring.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ── Mock localStorage (test environment is 'node', no browser globals) ───────
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => { localStorageStore[key] = value; },
  removeItem: (key: string) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
};
vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('window', { localStorage: localStorageMock });

import {
  ENGIN_REGISTRY,
  CREATIVE_ENGINES,
  recordForgeActivity,
  readForgeActivity,
  getForgeHeat,
  formatRelativeTime,
  type EnginEntry,
  type ForgeActivityPulse,
} from '@/lib/forge/forgeRegistry';

// ── Registry tests ────────────────────────────────────────────────────────────

describe('ENGIN_REGISTRY', () => {
  it('contains 7 entries (6 creative + forge)', () => {
    expect(ENGIN_REGISTRY).toHaveLength(7);
  });

  it('includes ForgeEngin as the last entry', () => {
    const forge = ENGIN_REGISTRY[ENGIN_REGISTRY.length - 1];
    expect(forge.id).toBe('forge');
    expect(forge.name).toBe('ForgeEngin');
    expect(forge.emoji).toBe('🔥');
  });

  it('every entry has required fields', () => {
    for (const entry of ENGIN_REGISTRY) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.emoji).toBeTruthy();
      expect(entry.accent).toMatch(/^#/);
      expect(entry.desc).toBeTruthy();
      expect(entry.daydreamHref).toMatch(/^\//);
      expect(entry.enginHref).toMatch(/^\//);
      expect(entry.capabilities.length).toBeGreaterThan(0);
    }
  });

  it('has unique ids', () => {
    const ids = ENGIN_REGISTRY.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique names', () => {
    const names = ENGIN_REGISTRY.map(e => e.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('CREATIVE_ENGINES', () => {
  it('contains 6 entries (no forge)', () => {
    expect(CREATIVE_ENGINES).toHaveLength(6);
  });

  it('does not include forge', () => {
    expect(CREATIVE_ENGINES.find(e => e.id === 'forge')).toBeUndefined();
  });

  it('includes all 6 creative engine ids', () => {
    const ids = CREATIVE_ENGINES.map(e => e.id);
    expect(ids).toContain('games');
    expect(ids).toContain('music');
    expect(ids).toContain('code');
    expect(ids).toContain('lab');
    expect(ids).toContain('brand');
    expect(ids).toContain('create');
  });
});

// ── Activity Pulse tests ──────────────────────────────────────────────────────

describe('Forge Activity Pulse', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('readForgeActivity returns empty array when no data', () => {
    expect(readForgeActivity()).toEqual([]);
  });

  it('recordForgeActivity stores a pulse', () => {
    recordForgeActivity('games', 'Launched MADMAXI');
    const activity = readForgeActivity();
    expect(activity).toHaveLength(1);
    expect(activity[0].enginId).toBe('games');
    expect(activity[0].label).toBe('Launched MADMAXI');
  });

  it('recordForgeActivity overwrites same engine', () => {
    recordForgeActivity('games', 'First action');
    recordForgeActivity('games', 'Second action');
    const activity = readForgeActivity();
    expect(activity).toHaveLength(1);
    expect(activity[0].label).toBe('Second action');
  });

  it('stores multiple engines independently', () => {
    recordForgeActivity('games', 'Play');
    recordForgeActivity('music', 'Record');
    recordForgeActivity('code', 'Edit');
    const activity = readForgeActivity();
    expect(activity).toHaveLength(3);
  });

  it('heat decays over time', () => {
    // Record activity in the past
    const pastTime = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 min ago
    localStorage.setItem('de:forge:activity', JSON.stringify({
      games: { enginId: 'games', lastActive: pastTime, heat: 1.0, label: 'test' },
    }));
    const activity = readForgeActivity();
    expect(activity[0].heat).toBeGreaterThan(0);
    expect(activity[0].heat).toBeLessThan(1);
    // 15 min = half of 30 min decay → heat should be ~0.5
    expect(activity[0].heat).toBeCloseTo(0.5, 1);
  });

  it('heat reaches 0 after 30 minutes', () => {
    const pastTime = new Date(Date.now() - 31 * 60 * 1000).toISOString(); // 31 min ago
    localStorage.setItem('de:forge:activity', JSON.stringify({
      games: { enginId: 'games', lastActive: pastTime, heat: 1.0, label: 'test' },
    }));
    const activity = readForgeActivity();
    expect(activity[0].heat).toBe(0);
  });

  it('fresh activity has heat 1.0', () => {
    recordForgeActivity('music', 'Beat drop');
    const activity = readForgeActivity();
    // Heat should be very close to 1.0 (just recorded)
    expect(activity[0].heat).toBeGreaterThan(0.99);
  });
});

describe('getForgeHeat', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null for unknown engine', () => {
    expect(getForgeHeat('nonexistent')).toBeNull();
  });

  it('returns pulse for known engine', () => {
    recordForgeActivity('lab', 'Experiment');
    const pulse = getForgeHeat('lab');
    expect(pulse).not.toBeNull();
    expect(pulse!.enginId).toBe('lab');
  });
});

// ── formatRelativeTime tests ──────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('returns "just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns minutes for timestamps < 1h ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours for timestamps < 1d ago', () => {
    const threeHrsAgo = new Date(Date.now() - 3 * 3600_000).toISOString();
    expect(formatRelativeTime(threeHrsAgo)).toBe('3h ago');
  });

  it('returns days for older timestamps', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400_000).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago');
  });
});

// ── Integration wiring tests ──────────────────────────────────────────────────

describe('ForgeEngin integration wiring', () => {
  it('ForgeEngin is listed in ENGIN_REGISTRY with correct accent', () => {
    const forge = ENGIN_REGISTRY.find(e => e.id === 'forge');
    expect(forge).toBeDefined();
    expect(forge!.accent).toBe('#ef4444');
  });

  it('ForgeEngin daydreamHref points to /daydream/forge', () => {
    const forge = ENGIN_REGISTRY.find(e => e.id === 'forge');
    expect(forge!.daydreamHref).toBe('/daydream/forge');
  });

  it('every creative engine has daydream and engin routes', () => {
    for (const engine of CREATIVE_ENGINES) {
      expect(engine.daydreamHref).toMatch(/^\/daydream\//);
      expect(engine.enginHref).toMatch(/^\/engines\//);
    }
  });

  it('all engine accents are valid hex colors', () => {
    for (const engine of ENGIN_REGISTRY) {
      expect(engine.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
