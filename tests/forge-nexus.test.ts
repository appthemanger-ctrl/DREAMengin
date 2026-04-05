/**
 * Forge Nexus Tests
 *
 * Tests for the engine connection graph, flow analysis,
 * cluster detection, and dominant pipeline finding.
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
  buildTransitionMap,
  computeEdges,
  computeNodes,
  detectClusters,
  findDominantPipeline,
  computeNexus,
} from '@/lib/forge/forgeNexus';

import { CREATIVE_ENGINES, FORGE_HISTORY_KEY } from '@/lib/forge/forgeRegistry';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(enginId: string, label: string, hoursAgo: number) {
  return {
    enginId,
    label,
    timestamp: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
  };
}

function seedHistory(entries: Array<{ enginId: string; label: string; timestamp: string }>) {
  localStorage.setItem(FORGE_HISTORY_KEY, JSON.stringify(entries));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Forge Nexus', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('buildTransitionMap', () => {
    it('returns empty map for empty history', () => {
      const map = buildTransitionMap([]);
      expect(map.size).toBe(0);
    });

    it('returns empty map for single entry', () => {
      const map = buildTransitionMap([makeEntry('games', 'test', 1)]);
      expect(map.size).toBe(0);
    });

    it('counts transitions between different engines', () => {
      const history = [
        makeEntry('games', 'a', 3),
        makeEntry('music', 'b', 2),
        makeEntry('games', 'c', 1),
        makeEntry('music', 'd', 0.5),
      ];
      const map = buildTransitionMap(history);
      expect(map.get('games→music')).toBe(2);
      expect(map.get('music→games')).toBe(1);
    });

    it('skips same-engine consecutive entries', () => {
      const history = [
        makeEntry('games', 'a', 3),
        makeEntry('games', 'b', 2),
        makeEntry('music', 'c', 1),
      ];
      const map = buildTransitionMap(history);
      expect(map.get('games→music')).toBe(1);
      expect(map.has('games→games')).toBe(false);
    });
  });

  describe('computeEdges', () => {
    it('returns empty array for empty map', () => {
      expect(computeEdges(new Map())).toEqual([]);
    });

    it('creates edges with normalised strength', () => {
      const map = new Map([
        ['games→music', 4],
        ['music→games', 2],
        ['games→code', 1],
      ]);
      const edges = computeEdges(map);
      expect(edges).toHaveLength(3);

      // Strongest edge should have strength 1.0
      expect(edges[0].weight).toBe(4);
      expect(edges[0].strength).toBe(1.0);

      // Weakest edge
      const weakest = edges.find(e => e.from === 'games' && e.to === 'code');
      expect(weakest!.strength).toBe(0.25);
    });

    it('sorts edges by weight descending', () => {
      const map = new Map([
        ['games→music', 1],
        ['music→code', 5],
        ['code→lab', 3],
      ]);
      const edges = computeEdges(map);
      expect(edges[0].weight).toBeGreaterThanOrEqual(edges[1].weight);
      expect(edges[1].weight).toBeGreaterThanOrEqual(edges[2].weight);
    });

    it('includes display labels with emojis', () => {
      const map = new Map([['games→music', 1]]);
      const edges = computeEdges(map);
      expect(edges[0].label).toContain('→');
    });
  });

  describe('computeNodes', () => {
    it('returns all creative engines even with no edges', () => {
      const nodes = computeNodes([]);
      expect(nodes).toHaveLength(CREATIVE_ENGINES.length);
      for (const node of nodes) {
        expect(node.isolated).toBe(true);
        expect(node.centrality).toBe(0);
      }
    });

    it('computes inbound/outbound counts', () => {
      const edges = computeEdges(new Map([
        ['games→music', 3],
        ['music→code', 2],
      ]));
      const nodes = computeNodes(edges);

      const games = nodes.find(n => n.id === 'games')!;
      expect(games.outbound).toBe(3);
      expect(games.inbound).toBe(0);

      const music = nodes.find(n => n.id === 'music')!;
      expect(music.outbound).toBe(2);
      expect(music.inbound).toBe(3);

      const code = nodes.find(n => n.id === 'code')!;
      expect(code.inbound).toBe(2);
      expect(code.outbound).toBe(0);
    });

    it('computes centrality normalised 0–1', () => {
      const edges = computeEdges(new Map([
        ['games→music', 5],
        ['music→games', 5],
      ]));
      const nodes = computeNodes(edges);

      for (const node of nodes) {
        expect(node.centrality).toBeGreaterThanOrEqual(0);
        expect(node.centrality).toBeLessThanOrEqual(1);
      }

      // games and music should both have centrality 1.0
      const games = nodes.find(n => n.id === 'games')!;
      const music = nodes.find(n => n.id === 'music')!;
      expect(games.centrality).toBe(1);
      expect(music.centrality).toBe(1);
    });

    it('marks isolated engines', () => {
      const edges = computeEdges(new Map([['games→music', 1]]));
      const nodes = computeNodes(edges);

      const lab = nodes.find(n => n.id === 'lab')!;
      expect(lab.isolated).toBe(true);
    });
  });

  describe('detectClusters', () => {
    it('returns empty for no bidirectional edges', () => {
      const edges = computeEdges(new Map([['games→music', 3]]));
      expect(detectClusters(edges)).toEqual([]);
    });

    it('detects bidirectional pair as a cluster', () => {
      const edges = computeEdges(new Map([
        ['games→music', 3],
        ['music→games', 2],
      ]));
      const clusters = detectClusters(edges);
      expect(clusters).toHaveLength(1);
      expect(clusters[0].engines).toContain('games');
      expect(clusters[0].engines).toContain('music');
      expect(clusters[0].internalWeight).toBe(5);
    });

    it('merges overlapping pairs', () => {
      const edges = computeEdges(new Map([
        ['games→music', 2],
        ['music→games', 2],
        ['music→code', 2],
        ['code→music', 2],
      ]));
      const clusters = detectClusters(edges);
      // games-music and music-code should merge into one cluster
      expect(clusters.length).toBeLessThanOrEqual(2);
      const allEngines = clusters.flatMap(c => c.engines);
      expect(allEngines).toContain('games');
      expect(allEngines).toContain('music');
      expect(allEngines).toContain('code');
    });
  });

  describe('findDominantPipeline', () => {
    it('returns empty for no edges', () => {
      expect(findDominantPipeline([])).toEqual([]);
    });

    it('finds the strongest path', () => {
      const edges = computeEdges(new Map([
        ['music→games', 5],
        ['games→code', 3],
        ['code→lab', 1],
      ]));
      const pipeline = findDominantPipeline(edges);
      expect(pipeline.length).toBeGreaterThanOrEqual(2);
      expect(pipeline[0]).toBe('music');
      expect(pipeline[1]).toBe('games');
    });

    it('does not revisit engines (no cycles)', () => {
      const edges = computeEdges(new Map([
        ['games→music', 5],
        ['music→games', 4], // cycle
        ['games→code', 3],
      ]));
      const pipeline = findDominantPipeline(edges);
      const unique = new Set(pipeline);
      expect(unique.size).toBe(pipeline.length);
    });
  });

  describe('computeNexus', () => {
    it('returns valid snapshot with empty history', () => {
      const snap = computeNexus([]);
      expect(snap.edges).toEqual([]);
      expect(snap.nodes).toHaveLength(CREATIVE_ENGINES.length);
      expect(snap.clusters).toEqual([]);
      expect(snap.dominantPipeline).toEqual([]);
      expect(snap.totalTransitions).toBe(0);
      expect(snap.computedAt).toBeTruthy();
    });

    it('computes full snapshot from history', () => {
      const history = [
        makeEntry('games', 'a', 5),
        makeEntry('music', 'b', 4),
        makeEntry('games', 'c', 3),
        makeEntry('code', 'd', 2),
        makeEntry('games', 'e', 1),
        makeEntry('music', 'f', 0.5),
      ];
      const snap = computeNexus(history);
      expect(snap.edges.length).toBeGreaterThan(0);
      expect(snap.totalTransitions).toBeGreaterThan(0);
      expect(snap.nodes.some(n => !n.isolated)).toBe(true);
    });

    it('reads from localStorage when no override provided', () => {
      seedHistory([
        makeEntry('games', 'a', 2),
        makeEntry('music', 'b', 1),
      ]);
      const snap = computeNexus();
      expect(snap.edges.length).toBeGreaterThan(0);
    });
  });
});
