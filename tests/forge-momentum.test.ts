/**
 * Forge Momentum Tests
 *
 * Tests for the creative momentum scoring system:
 * velocity, diversity, streak, depth, composite, and level.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mock localStorage ────────────────────────────────────────────────────────
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
  computeVelocity,
  computeDiversity,
  computeStreak,
  computeDepth,
  computeMomentum,
  getLevel,
  getLevelColor,
  getLevelEmoji,
  readHistory,
  type MomentumLevel,
} from '@/lib/forge/forgeMomentum';

import { FORGE_HISTORY_KEY } from '@/lib/forge/forgeRegistry';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(enginId: string, label: string, hoursAgo: number) {
  return {
    enginId,
    label,
    timestamp: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
  };
}

function makeEntryAt(enginId: string, label: string, date: Date) {
  return {
    enginId,
    label,
    timestamp: date.toISOString(),
  };
}

function seedHistory(entries: Array<{ enginId: string; label: string; timestamp: string }>) {
  localStorage.setItem(FORGE_HISTORY_KEY, JSON.stringify(entries));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Forge Momentum', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('readHistory', () => {
    it('returns empty array when no data', () => {
      expect(readHistory()).toEqual([]);
    });

    it('reads stored history', () => {
      const entries = [makeEntry('games', 'test', 1)];
      seedHistory(entries);
      expect(readHistory()).toHaveLength(1);
    });
  });

  describe('computeVelocity', () => {
    it('returns 0 for empty history', () => {
      expect(computeVelocity([])).toBe(0);
    });

    it('returns 0 when all actions are older than 24h', () => {
      const history = [makeEntry('games', 'test', 25)];
      expect(computeVelocity(history)).toBe(0);
    });

    it('returns positive score for recent actions', () => {
      const history = [
        makeEntry('games', 'a', 0.5),
        makeEntry('music', 'b', 0.4),
        makeEntry('code', 'c', 0.3),
      ];
      expect(computeVelocity(history)).toBeGreaterThan(0);
    });

    it('caps at 100', () => {
      // 20 actions in the last hour → 20 actions/hour → should cap at 100
      const history = Array.from({ length: 20 }, (_, i) =>
        makeEntry('games', `action-${i}`, i * 0.01),
      );
      expect(computeVelocity(history)).toBeLessThanOrEqual(100);
    });
  });

  describe('computeDiversity', () => {
    it('returns 0 for empty history', () => {
      expect(computeDiversity([])).toBe(0);
    });

    it('returns ~17 for 1 engine used (1/6)', () => {
      const history = [makeEntry('games', 'test', 1)];
      expect(computeDiversity(history)).toBe(17); // Math.round(1/6 * 100)
    });

    it('returns 100 when all 6 engines used', () => {
      const history = [
        makeEntry('games', 'a', 1),
        makeEntry('music', 'b', 2),
        makeEntry('code', 'c', 3),
        makeEntry('lab', 'd', 4),
        makeEntry('brand', 'e', 5),
        makeEntry('create', 'f', 6),
      ];
      expect(computeDiversity(history)).toBe(100);
    });

    it('ignores entries older than 7 days', () => {
      const history = [makeEntry('games', 'test', 170)]; // ~7.08 days ago
      expect(computeDiversity(history)).toBe(0);
    });
  });

  describe('computeStreak', () => {
    it('returns 0 for empty history', () => {
      expect(computeStreak([])).toBe(0);
    });

    it('returns 1 for activity today', () => {
      const history = [makeEntry('games', 'test', 0.5)];
      expect(computeStreak(history)).toBe(1);
    });

    it('counts consecutive days', () => {
      const now = new Date();
      const history = [
        makeEntryAt('games', 'a', now),
        makeEntryAt('games', 'b', new Date(now.getTime() - 86_400_000)),
        makeEntryAt('games', 'c', new Date(now.getTime() - 2 * 86_400_000)),
      ];
      expect(computeStreak(history)).toBeGreaterThanOrEqual(2);
    });
  });

  describe('computeDepth', () => {
    it('returns 0 for empty history', () => {
      expect(computeDepth([])).toBe(0);
    });

    it('returns 0 for all shallow actions', () => {
      const history = [
        makeEntry('games', 'Entered games', 1),
        makeEntry('music', 'Activated StarMaker', 2),
      ];
      expect(computeDepth(history)).toBe(0);
    });

    it('returns 100 for all meaningful actions', () => {
      const history = [
        makeEntry('games', 'Built a new level', 1),
        makeEntry('music', 'Composed a track', 2),
      ];
      expect(computeDepth(history)).toBe(100);
    });

    it('returns partial score for mixed actions', () => {
      const history = [
        makeEntry('games', 'Built a level', 1),
        makeEntry('games', 'Entered games', 2),
      ];
      const depth = computeDepth(history);
      expect(depth).toBeGreaterThan(0);
      expect(depth).toBeLessThan(100);
    });
  });

  describe('getLevel', () => {
    it('maps scores to correct levels', () => {
      expect(getLevel(0)).toBe('DORMANT');
      expect(getLevel(14)).toBe('DORMANT');
      expect(getLevel(15)).toBe('WARMING');
      expect(getLevel(39)).toBe('WARMING');
      expect(getLevel(40)).toBe('FLOWING');
      expect(getLevel(64)).toBe('FLOWING');
      expect(getLevel(65)).toBe('BLAZING');
      expect(getLevel(84)).toBe('BLAZING');
      expect(getLevel(85)).toBe('TRANSCENDENT');
      expect(getLevel(100)).toBe('TRANSCENDENT');
    });
  });

  describe('getLevelColor', () => {
    it('returns a hex colour for each level', () => {
      const levels: MomentumLevel[] = ['DORMANT', 'WARMING', 'FLOWING', 'BLAZING', 'TRANSCENDENT'];
      for (const level of levels) {
        expect(getLevelColor(level)).toMatch(/^#/);
      }
    });
  });

  describe('getLevelEmoji', () => {
    it('returns an emoji for each level', () => {
      const levels: MomentumLevel[] = ['DORMANT', 'WARMING', 'FLOWING', 'BLAZING', 'TRANSCENDENT'];
      for (const level of levels) {
        expect(getLevelEmoji(level)).toBeTruthy();
      }
    });
  });

  describe('computeMomentum', () => {
    it('returns a valid snapshot with empty history', () => {
      const snap = computeMomentum([]);
      expect(snap.composite).toBe(0);
      expect(snap.level).toBe('DORMANT');
      expect(snap.dimensions).toHaveLength(4);
      expect(snap.enginesUsedToday).toEqual([]);
      expect(snap.actionsToday).toBe(0);
      expect(snap.actionsWeek).toBe(0);
      expect(snap.streakDays).toBe(0);
      expect(snap.computedAt).toBeTruthy();
    });

    it('computes positive score with activity', () => {
      const history = [
        makeEntry('games', 'Built a level', 0.5),
        makeEntry('music', 'Composed a track', 0.4),
        makeEntry('code', 'Deployed an API', 0.3),
      ];
      const snap = computeMomentum(history);
      expect(snap.composite).toBeGreaterThan(0);
      expect(snap.enginesUsedToday.length).toBeGreaterThanOrEqual(3);
      expect(snap.actionsToday).toBe(3);
      expect(snap.dimensions.find(d => d.name === 'Velocity')!.score).toBeGreaterThan(0);
      expect(snap.dimensions.find(d => d.name === 'Diversity')!.score).toBeGreaterThan(0);
    });

    it('reads from localStorage when no override provided', () => {
      seedHistory([makeEntry('games', 'test', 0.5)]);
      const snap = computeMomentum();
      expect(snap.actionsToday).toBe(1);
    });

    it('dimension scores are all 0–100', () => {
      const history = Array.from({ length: 50 }, (_, i) =>
        makeEntry(['games', 'music', 'code', 'lab', 'brand', 'create'][i % 6], `action-${i}`, i * 0.1),
      );
      const snap = computeMomentum(history);
      for (const dim of snap.dimensions) {
        expect(dim.score).toBeGreaterThanOrEqual(0);
        expect(dim.score).toBeLessThanOrEqual(100);
      }
    });

    it('composite is a weighted average capped at 100', () => {
      const history = Array.from({ length: 100 }, (_, i) =>
        makeEntry(['games', 'music', 'code', 'lab', 'brand', 'create'][i % 6], `Created something ${i}`, i * 0.01),
      );
      const snap = computeMomentum(history);
      expect(snap.composite).toBeGreaterThanOrEqual(0);
      expect(snap.composite).toBeLessThanOrEqual(100);
    });
  });
});
