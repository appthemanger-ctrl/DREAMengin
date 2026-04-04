/**
 * Forge Nexus — Engine Connection Graph & Flow Analysis
 *
 * Builds a directed graph of engine-to-engine transitions from activity history.
 * Computes connection strengths, identifies dominant flows, and detects
 * engine "affinity clusters" — groups of engines that are frequently used together.
 *
 * The Nexus graph is the relational intelligence layer of the Forge:
 * - Which engines do you naturally pair?
 * - What's your strongest creative pipeline?
 * - Which engines are isolated (never connected to others)?
 *
 * Architecture: Pure computation from Forge history. No Supabase writes.
 */

import { FORGE_HISTORY_KEY, CREATIVE_ENGINES, ENGIN_REGISTRY } from './forgeRegistry';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NexusEdge {
  /** Source engine id */
  from: string;
  /** Target engine id */
  to: string;
  /** Number of observed transitions */
  weight: number;
  /** Normalised strength 0–1 (relative to max edge in the graph) */
  strength: number;
  /** Display label (e.g. "🎵 → 🎮") */
  label: string;
}

export interface NexusNode {
  /** Engine id */
  id: string;
  /** Engine name */
  name: string;
  /** Emoji */
  emoji: string;
  /** Accent colour */
  accent: string;
  /** Total inbound transitions */
  inbound: number;
  /** Total outbound transitions */
  outbound: number;
  /** Degree centrality (inbound + outbound, normalised 0–1) */
  centrality: number;
  /** Whether this engine is "isolated" (zero connections) */
  isolated: boolean;
}

export interface AffinityCluster {
  /** Cluster id */
  id: string;
  /** Engine ids in this cluster */
  engines: string[];
  /** Total edge weight within the cluster */
  internalWeight: number;
  /** Display label */
  label: string;
  /** Accent (from the highest-centrality engine) */
  accent: string;
}

export interface NexusSnapshot {
  /** All edges (transitions) with weight > 0 */
  edges: NexusEdge[];
  /** All engine nodes with computed metrics */
  nodes: NexusNode[];
  /** Detected affinity clusters */
  clusters: AffinityCluster[];
  /** The single strongest pipeline (sequence of engines) */
  dominantPipeline: string[];
  /** Total transitions observed */
  totalTransitions: number;
  /** Timestamp of computation */
  computedAt: string;
}

// ── History Entry type ────────────────────────────────────────────────────────

interface HistoryEntry {
  enginId: string;
  label: string;
  timestamp: string;
}

// ── Core Computation ──────────────────────────────────────────────────────────

/**
 * Read history entries from localStorage.
 */
function readHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FORGE_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

/**
 * Build a directed transition map from history.
 * Key: "from→to", Value: count
 */
export function buildTransitionMap(history: HistoryEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 1; i < history.length; i++) {
    const from = history[i - 1].enginId;
    const to = history[i].enginId;
    if (from === to) continue;
    const key = `${from}→${to}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

/**
 * Compute all edges from a transition map.
 */
export function computeEdges(transitions: Map<string, number>): NexusEdge[] {
  if (transitions.size === 0) return [];

  const maxWeight = Math.max(...transitions.values());
  const edges: NexusEdge[] = [];

  for (const [key, weight] of transitions) {
    const [from, to] = key.split('→');
    const fromEng = ENGIN_REGISTRY.find(e => e.id === from);
    const toEng = ENGIN_REGISTRY.find(e => e.id === to);
    if (!fromEng || !toEng) continue;

    edges.push({
      from,
      to,
      weight,
      strength: maxWeight > 0 ? weight / maxWeight : 0,
      label: `${fromEng.emoji} → ${toEng.emoji}`,
    });
  }

  return edges.sort((a, b) => b.weight - a.weight);
}

/**
 * Compute node metrics from edges.
 */
export function computeNodes(edges: NexusEdge[]): NexusNode[] {
  const creativeIds = new Set(CREATIVE_ENGINES.map(e => e.id));
  const inbound = new Map<string, number>();
  const outbound = new Map<string, number>();

  for (const edge of edges) {
    outbound.set(edge.from, (outbound.get(edge.from) ?? 0) + edge.weight);
    inbound.set(edge.to, (inbound.get(edge.to) ?? 0) + edge.weight);
  }

  const maxDegree = Math.max(
    1,
    ...CREATIVE_ENGINES.map(e =>
      (inbound.get(e.id) ?? 0) + (outbound.get(e.id) ?? 0),
    ),
  );

  return CREATIVE_ENGINES.map(engine => {
    const ib = inbound.get(engine.id) ?? 0;
    const ob = outbound.get(engine.id) ?? 0;
    return {
      id: engine.id,
      name: engine.name,
      emoji: engine.emoji,
      accent: engine.accent,
      inbound: ib,
      outbound: ob,
      centrality: (ib + ob) / maxDegree,
      isolated: ib === 0 && ob === 0,
    };
  });
}

/**
 * Detect affinity clusters — groups of engines that are mutually connected.
 * Uses a simple greedy approach: find pairs with bidirectional edges,
 * then merge overlapping pairs.
 */
export function detectClusters(edges: NexusEdge[]): AffinityCluster[] {
  // Find bidirectional pairs
  const pairs: Array<[string, string, number]> = [];
  const edgeMap = new Map<string, number>();
  for (const edge of edges) {
    edgeMap.set(`${edge.from}→${edge.to}`, edge.weight);
  }

  const seen = new Set<string>();
  for (const edge of edges) {
    const reverseKey = `${edge.to}→${edge.from}`;
    const reverseWeight = edgeMap.get(reverseKey) ?? 0;
    const pairKey = [edge.from, edge.to].sort().join('+');
    if (reverseWeight > 0 && !seen.has(pairKey)) {
      seen.add(pairKey);
      pairs.push([edge.from, edge.to, edge.weight + reverseWeight]);
    }
  }

  if (pairs.length === 0) return [];

  // Merge overlapping pairs into clusters
  const clusters: Set<string>[] = [];
  const weights: number[] = [];

  for (const [a, b, w] of pairs) {
    let merged = false;
    for (let i = 0; i < clusters.length; i++) {
      if (clusters[i].has(a) || clusters[i].has(b)) {
        clusters[i].add(a);
        clusters[i].add(b);
        weights[i] += w;
        merged = true;
        break;
      }
    }
    if (!merged) {
      clusters.push(new Set([a, b]));
      weights.push(w);
    }
  }

  return clusters.map((engineSet, i) => {
    const engineIds = [...engineSet];
    // Pick accent from highest-centrality engine
    const primary = ENGIN_REGISTRY.find(e => e.id === engineIds[0]);
    const emojis = engineIds
      .map(id => ENGIN_REGISTRY.find(e => e.id === id)?.emoji ?? '?')
      .join(' + ');

    return {
      id: `cluster-${i}`,
      engines: engineIds,
      internalWeight: weights[i],
      label: emojis,
      accent: primary?.accent ?? '#ef4444',
    };
  });
}

/**
 * Find the dominant pipeline — the longest frequently-used chain of engines.
 * Uses greedy path extension from the most-used starting engine.
 */
export function findDominantPipeline(edges: NexusEdge[]): string[] {
  if (edges.length === 0) return [];

  // Build adjacency: for each engine, find the strongest outbound edge
  const bestNext = new Map<string, { to: string; weight: number }>();
  for (const edge of edges) {
    const current = bestNext.get(edge.from);
    if (!current || edge.weight > current.weight) {
      bestNext.set(edge.from, { to: edge.to, weight: edge.weight });
    }
  }

  // Start from the engine with the most outbound weight
  const outWeights = new Map<string, number>();
  for (const edge of edges) {
    outWeights.set(edge.from, (outWeights.get(edge.from) ?? 0) + edge.weight);
  }

  let startEngine = '';
  let maxOut = 0;
  for (const [id, w] of outWeights) {
    if (w > maxOut) {
      maxOut = w;
      startEngine = id;
    }
  }

  if (!startEngine) return [];

  // Greedy walk, avoiding cycles
  const pipeline: string[] = [startEngine];
  const visited = new Set<string>([startEngine]);
  let current = startEngine;

  while (pipeline.length < CREATIVE_ENGINES.length) {
    const next = bestNext.get(current);
    if (!next || visited.has(next.to)) break;
    pipeline.push(next.to);
    visited.add(next.to);
    current = next.to;
  }

  return pipeline;
}

/**
 * Compute a full Nexus snapshot from current history data.
 */
export function computeNexus(historyOverride?: HistoryEntry[]): NexusSnapshot {
  const history = historyOverride ?? readHistory();
  const transitions = buildTransitionMap(history);
  const edges = computeEdges(transitions);
  const nodes = computeNodes(edges);
  const clusters = detectClusters(edges);
  const dominantPipeline = findDominantPipeline(edges);
  const totalTransitions = edges.reduce((sum, e) => sum + e.weight, 0);

  return {
    edges,
    nodes,
    clusters,
    dominantPipeline,
    totalTransitions,
    computedAt: new Date().toISOString(),
  };
}
