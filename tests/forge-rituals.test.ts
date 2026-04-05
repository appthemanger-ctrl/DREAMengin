/**
 * Forge Rituals Tests
 *
 * Tests for the auto-detected recurring workflow patterns:
 * time patterns, sequence patterns, session patterns, and affinity patterns.
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
  getTimeBucket,
  detectTimePatterns,
  detectSequencePatterns,
  detectSessionPatterns,
  detectAffinityPatterns,
  computeRituals,
} from '@/lib/forge/forgeRituals';

import { FORGE_HISTORY_KEY } from '@/lib/forge/forgeRegistry';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(enginId: string, label: string, hoursAgo: number) {
  return {
    enginId,
    label,
    timestamp: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
  };
}

function makeEntryAtHour(enginId: string, label: string, hour: number, daysAgo = 0) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return {
    enginId,
    label,
    timestamp: d.toISOString(),
  };
}

function seedHistory(entries: Array<{ enginId: string; label: string; timestamp: string }>) {
  localStorage.setItem(FORGE_HISTORY_KEY, JSON.stringify(entries));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Forge Rituals', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getTimeBucket', () => {
    it('classifies morning hours (5-11)', () => {
      expect(getTimeBucket(5).label).toBe('morning');
      expect(getTimeBucket(8).label).toBe('morning');
      expect(getTimeBucket(11).label).toBe('morning');
    });

    it('classifies afternoon hours (12-16)', () => {
      expect(getTimeBucket(12).label).toBe('afternoon');
      expect(getTimeBucket(14).label).toBe('afternoon');
      expect(getTimeBucket(16).label).toBe('afternoon');
    });

    it('classifies evening hours (17-20)', () => {
      expect(getTimeBucket(17).label).toBe('evening');
      expect(getTimeBucket(19).label).toBe('evening');
      expect(getTimeBucket(20).label).toBe('evening');
    });

    it('classifies night hours (21-4)', () => {
      expect(getTimeBucket(21).label).toBe('night');
      expect(getTimeBucket(23).label).toBe('night');
      expect(getTimeBucket(0).label).toBe('night');
      expect(getTimeBucket(3).label).toBe('night');
    });
  });

  describe('detectTimePatterns', () => {
    it('returns empty for empty history', () => {
      expect(detectTimePatterns([])).toEqual([]);
    });

    it('returns empty for insufficient data', () => {
      expect(detectTimePatterns([makeEntry('games', 'test', 1)])).toEqual([]);
    });

    it('detects dominant time-of-day pattern', () => {
      // All music usage in the evening
      const history = [
        makeEntryAtHour('music', 'a', 18, 0),
        makeEntryAtHour('music', 'b', 19, 1),
        makeEntryAtHour('music', 'c', 20, 2),
      ];
      const rituals = detectTimePatterns(history);
      expect(rituals.length).toBeGreaterThan(0);
      expect(rituals[0].type).toBe('time-pattern');
      expect(rituals[0].engines).toContain('music');
      expect(rituals[0].title).toContain('evening');
    });

    it('does not flag evenly distributed usage', () => {
      const history = [
        makeEntryAtHour('games', 'a', 8),   // morning
        makeEntryAtHour('games', 'b', 14),  // afternoon
        makeEntryAtHour('games', 'c', 18),  // evening
        makeEntryAtHour('games', 'd', 22),  // night
      ];
      const rituals = detectTimePatterns(history);
      // No single bucket should dominate (all 25%)
      expect(rituals).toEqual([]);
    });
  });

  describe('detectSequencePatterns', () => {
    it('returns empty for empty history', () => {
      expect(detectSequencePatterns([])).toEqual([]);
    });

    it('returns empty for insufficient data', () => {
      expect(detectSequencePatterns([makeEntry('games', 'test', 1)])).toEqual([]);
    });

    it('detects bigram (2-engine) patterns', () => {
      const history = [
        makeEntry('music', 'a', 6),
        makeEntry('games', 'b', 5),
        makeEntry('code', 'c', 4),
        makeEntry('music', 'd', 3),
        makeEntry('games', 'e', 2),
        makeEntry('lab', 'f', 1),
      ];
      const rituals = detectSequencePatterns(history);
      const bigrams = rituals.filter(r => r.id.startsWith('seq2'));
      expect(bigrams.length).toBeGreaterThan(0);

      // music→games should appear (2 times)
      const musicToGames = bigrams.find(r => 
        r.engines[0] === 'music' && r.engines[1] === 'games'
      );
      expect(musicToGames).toBeDefined();
      expect(musicToGames!.occurrences).toBe(2);
    });

    it('detects trigram (3-engine) patterns', () => {
      const history = [
        makeEntry('music', 'a', 10),
        makeEntry('games', 'b', 9),
        makeEntry('code', 'c', 8),
        makeEntry('lab', 'd', 7),
        makeEntry('music', 'e', 6),
        makeEntry('games', 'f', 5),
        makeEntry('code', 'g', 4),
      ];
      const rituals = detectSequencePatterns(history);
      const trigrams = rituals.filter(r => r.id.startsWith('seq3'));
      expect(trigrams.length).toBeGreaterThan(0);

      // music→games→code should appear (2 times)
      const mgc = trigrams.find(r =>
        r.engines[0] === 'music' && r.engines[1] === 'games' && r.engines[2] === 'code'
      );
      expect(mgc).toBeDefined();
      expect(mgc!.occurrences).toBe(2);
    });

    it('collapses consecutive same-engine entries', () => {
      const history = [
        makeEntry('games', 'a', 5),
        makeEntry('games', 'b', 4), // should be collapsed
        makeEntry('music', 'c', 3),
        makeEntry('games', 'd', 2),
        makeEntry('music', 'e', 1),
      ];
      const rituals = detectSequencePatterns(history);
      const gamesMusic = rituals.find(r =>
        r.id.startsWith('seq2') && r.engines[0] === 'games' && r.engines[1] === 'music'
      );
      expect(gamesMusic).toBeDefined();
      expect(gamesMusic!.occurrences).toBe(2);
    });
  });

  describe('detectSessionPatterns', () => {
    it('returns empty for empty history', () => {
      expect(detectSessionPatterns([])).toEqual([]);
    });

    it('returns empty for insufficient data', () => {
      const history = [makeEntry('games', 'test', 1)];
      expect(detectSessionPatterns(history)).toEqual([]);
    });

    it('detects multi-engine sessions', () => {
      // Two sessions, each using 3 engines, within 30min gaps
      const now = Date.now();
      const history = [
        { enginId: 'games', label: 'a', timestamp: new Date(now - 120 * 60_000).toISOString() },
        { enginId: 'music', label: 'b', timestamp: new Date(now - 115 * 60_000).toISOString() },
        { enginId: 'code',  label: 'c', timestamp: new Date(now - 110 * 60_000).toISOString() },
        // gap > 30 min → new session
        { enginId: 'lab',   label: 'd', timestamp: new Date(now - 20 * 60_000).toISOString() },
        { enginId: 'brand', label: 'e', timestamp: new Date(now - 15 * 60_000).toISOString() },
        { enginId: 'create', label: 'f', timestamp: new Date(now - 10 * 60_000).toISOString() },
      ];
      const rituals = detectSessionPatterns(history);
      const multiEngine = rituals.find(r => r.id === 'session-multi-engine');
      expect(multiEngine).toBeDefined();
      expect(multiEngine!.description).toContain('3.0');
    });
  });

  describe('detectAffinityPatterns', () => {
    it('returns empty for empty history', () => {
      expect(detectAffinityPatterns([])).toEqual([]);
    });

    it('identifies the most-used engine', () => {
      const history = [
        makeEntry('games', 'a', 5),
        makeEntry('games', 'b', 4),
        makeEntry('games', 'c', 3),
        makeEntry('music', 'd', 2),
      ];
      const rituals = detectAffinityPatterns(history);
      const topAffinity = rituals.find(r => r.id === 'affinity-games');
      expect(topAffinity).toBeDefined();
      expect(topAffinity!.title).toContain('GameEngin');
      expect(topAffinity!.occurrences).toBe(3);
    });

    it('detects unexplored engines', () => {
      const history = [
        makeEntry('games', 'a', 2),
        makeEntry('music', 'b', 1),
      ];
      const rituals = detectAffinityPatterns(history);
      const unexplored = rituals.find(r => r.id === 'affinity-unexplored');
      expect(unexplored).toBeDefined();
      expect(unexplored!.engines.length).toBeGreaterThan(0);
      // Should not include games or music
      expect(unexplored!.engines).not.toContain('games');
      expect(unexplored!.engines).not.toContain('music');
    });
  });

  describe('computeRituals', () => {
    it('returns valid snapshot with empty history', () => {
      const snap = computeRituals([]);
      expect(snap.rituals).toEqual([]);
      expect(snap.historySize).toBe(0);
      expect(snap.computedAt).toBeTruthy();
    });

    it('combines all pattern types', () => {
      const now = Date.now();
      const history = [
        { enginId: 'games', label: 'Built level', timestamp: new Date(now - 6 * 3_600_000).toISOString() },
        { enginId: 'music', label: 'Mixed track', timestamp: new Date(now - 5.9 * 3_600_000).toISOString() },
        { enginId: 'games', label: 'Tested', timestamp: new Date(now - 5.8 * 3_600_000).toISOString() },
        { enginId: 'music', label: 'Mastered', timestamp: new Date(now - 5.7 * 3_600_000).toISOString() },
        { enginId: 'code',  label: 'Deployed', timestamp: new Date(now - 3 * 3_600_000).toISOString() },
        { enginId: 'games', label: 'Played', timestamp: new Date(now - 2.9 * 3_600_000).toISOString() },
        { enginId: 'music', label: 'Listened', timestamp: new Date(now - 2.8 * 3_600_000).toISOString() },
      ];
      const snap = computeRituals(history);
      expect(snap.historySize).toBe(7);
      expect(snap.rituals.length).toBeGreaterThan(0);
    });

    it('sorts rituals by confidence descending', () => {
      const now = Date.now();
      const history = Array.from({ length: 20 }, (_, i) =>
        ({ enginId: i % 2 === 0 ? 'games' : 'music', label: 'action', timestamp: new Date(now - i * 60_000).toISOString() }),
      );
      const snap = computeRituals(history);
      for (let i = 1; i < snap.rituals.length; i++) {
        expect(snap.rituals[i - 1].confidence).toBeGreaterThanOrEqual(snap.rituals[i].confidence);
      }
    });

    it('reads from localStorage when no override provided', () => {
      seedHistory([
        makeEntry('games', 'a', 2),
        makeEntry('music', 'b', 1.9),
        makeEntry('games', 'c', 1.8),
      ]);
      const snap = computeRituals();
      expect(snap.historySize).toBe(3);
    });
  });
});
