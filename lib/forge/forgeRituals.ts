/**
 * Forge Rituals — Auto-Detected Recurring Workflow Patterns
 *
 * Scans activity history for recurring patterns and surfaces them as
 * "rituals" — habits the user has developed without explicitly defining.
 *
 * Detection methods:
 *   1. Time-of-day patterns — "You always use Music in the evening"
 *   2. Sequence patterns   — "You always go Music → Games → Create"
 *   3. Session patterns    — "Your sessions average 3 engine switches"
 *   4. Engine affinity     — "Your most-used engine is GameEngin"
 *
 * Architecture: Pure computation from Forge history. No Supabase writes.
 */

import { FORGE_HISTORY_KEY, CREATIVE_ENGINES, ENGIN_REGISTRY } from './forgeRegistry';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RitualType = 'time-pattern' | 'sequence' | 'session' | 'affinity';

export interface ForgeRitual {
  /** Unique ritual id */
  id: string;
  /** Type of pattern detected */
  type: RitualType;
  /** Human-readable title */
  title: string;
  /** Description of the detected pattern */
  description: string;
  /** Confidence 0–1 */
  confidence: number;
  /** Accent colour */
  accent: string;
  /** Emoji */
  emoji: string;
  /** Engine ids involved */
  engines: string[];
  /** How many times the pattern has been observed */
  occurrences: number;
}

export interface RitualSnapshot {
  /** All detected rituals, sorted by confidence */
  rituals: ForgeRitual[];
  /** Total history entries analysed */
  historySize: number;
  /** Timestamp of computation */
  computedAt: string;
}

// ── History Entry type ────────────────────────────────────────────────────────

interface HistoryEntry {
  enginId: string;
  label: string;
  timestamp: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MS_PER_HOUR = 3_600_000;

/** Minimum occurrences to consider a pattern a ritual */
const MIN_OCCURRENCES = 2;

/** Time-of-day buckets */
const TIME_BUCKETS = [
  { label: 'morning',   start: 5,  end: 12, emoji: '🌅' },
  { label: 'afternoon', start: 12, end: 17, emoji: '☀️' },
  { label: 'evening',   start: 17, end: 21, emoji: '🌆' },
  { label: 'night',     start: 21, end: 5,  emoji: '🌙' },
] as const;

// ── Core Detection ────────────────────────────────────────────────────────────

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
 * Get the time-of-day bucket for a given hour.
 */
export function getTimeBucket(hour: number): typeof TIME_BUCKETS[number] {
  // Night wraps around midnight
  if (hour >= 21 || hour < 5) return TIME_BUCKETS[3]; // night
  if (hour >= 5 && hour < 12) return TIME_BUCKETS[0]; // morning
  if (hour >= 12 && hour < 17) return TIME_BUCKETS[1]; // afternoon
  return TIME_BUCKETS[2]; // evening
}

/**
 * Detect time-of-day patterns: which engines are predominantly used at
 * specific times of day.
 */
export function detectTimePatterns(history: HistoryEntry[]): ForgeRitual[] {
  if (history.length < MIN_OCCURRENCES) return [];

  // Count engine usage by time bucket
  const counts: Record<string, Record<string, number>> = {};

  for (const entry of history) {
    const hour = new Date(entry.timestamp).getHours();
    const bucket = getTimeBucket(hour);
    if (!counts[entry.enginId]) counts[entry.enginId] = {};
    counts[entry.enginId][bucket.label] = (counts[entry.enginId][bucket.label] ?? 0) + 1;
  }

  const rituals: ForgeRitual[] = [];

  for (const [enginId, bucketCounts] of Object.entries(counts)) {
    const engine = ENGIN_REGISTRY.find(e => e.id === enginId);
    if (!engine) continue;

    const total = Object.values(bucketCounts).reduce((s, c) => s + c, 0);
    if (total < MIN_OCCURRENCES) continue;

    // Find dominant time bucket (> 60% of uses)
    for (const [bucketLabel, count] of Object.entries(bucketCounts)) {
      const ratio = count / total;
      if (ratio >= 0.6 && count >= MIN_OCCURRENCES) {
        const bucket = TIME_BUCKETS.find(b => b.label === bucketLabel);
        rituals.push({
          id: `time-${enginId}-${bucketLabel}`,
          type: 'time-pattern',
          title: `${engine.name} ${bucketLabel}`,
          description: `You tend to use ${engine.name} in the ${bucketLabel} (${Math.round(ratio * 100)}% of the time)`,
          confidence: ratio,
          accent: engine.accent,
          emoji: bucket?.emoji ?? '⏰',
          engines: [enginId],
          occurrences: count,
        });
      }
    }
  }

  return rituals;
}

/**
 * Detect sequence patterns: recurring 2- or 3-engine sequences.
 */
export function detectSequencePatterns(history: HistoryEntry[]): ForgeRitual[] {
  if (history.length < 3) return [];

  // Extract engine-switch sequences (ignore consecutive same-engine entries)
  const switches: string[] = [];
  let lastEngine = '';
  for (const entry of history) {
    if (entry.enginId !== lastEngine) {
      switches.push(entry.enginId);
      lastEngine = entry.enginId;
    }
  }

  const rituals: ForgeRitual[] = [];

  // Detect 2-grams
  const bigrams = new Map<string, number>();
  for (let i = 0; i < switches.length - 1; i++) {
    const key = `${switches[i]}→${switches[i + 1]}`;
    bigrams.set(key, (bigrams.get(key) ?? 0) + 1);
  }

  for (const [key, count] of bigrams) {
    if (count < MIN_OCCURRENCES) continue;
    const [fromId, toId] = key.split('→');
    const fromEng = ENGIN_REGISTRY.find(e => e.id === fromId);
    const toEng = ENGIN_REGISTRY.find(e => e.id === toId);
    if (!fromEng || !toEng) continue;

    const totalBigrams = switches.length - 1;
    const confidence = Math.min(1, count / Math.max(1, totalBigrams / 2));

    rituals.push({
      id: `seq2-${fromId}-${toId}`,
      type: 'sequence',
      title: `${fromEng.emoji} → ${toEng.emoji} flow`,
      description: `You frequently go from ${fromEng.name} to ${toEng.name} (${count} times)`,
      confidence,
      accent: fromEng.accent,
      emoji: '🔄',
      engines: [fromId, toId],
      occurrences: count,
    });
  }

  // Detect 3-grams
  const trigrams = new Map<string, number>();
  for (let i = 0; i < switches.length - 2; i++) {
    const key = `${switches[i]}→${switches[i + 1]}→${switches[i + 2]}`;
    trigrams.set(key, (trigrams.get(key) ?? 0) + 1);
  }

  for (const [key, count] of trigrams) {
    if (count < MIN_OCCURRENCES) continue;
    const parts = key.split('→');
    const engines = parts
      .map(id => ENGIN_REGISTRY.find(e => e.id === id))
      .filter(Boolean);
    if (engines.length !== 3) continue;

    const totalTrigrams = switches.length - 2;
    const confidence = Math.min(1, count / Math.max(1, totalTrigrams / 3));

    rituals.push({
      id: `seq3-${parts.join('-')}`,
      type: 'sequence',
      title: `${engines.map(e => e!.emoji).join(' → ')} pipeline`,
      description: `You repeat the ${engines.map(e => e!.name).join(' → ')} sequence (${count} times)`,
      confidence,
      accent: engines[0]!.accent,
      emoji: '🔗',
      engines: parts,
      occurrences: count,
    });
  }

  return rituals;
}

/**
 * Detect session patterns: average session length, engine switches per session.
 * A "session" is a group of actions with gaps < 30 minutes.
 */
export function detectSessionPatterns(history: HistoryEntry[]): ForgeRitual[] {
  if (history.length < 3) return [];

  const SESSION_GAP = 30 * 60_000; // 30 minutes
  const sessions: HistoryEntry[][] = [];
  let currentSession: HistoryEntry[] = [history[0]];

  for (let i = 1; i < history.length; i++) {
    const gap = new Date(history[i].timestamp).getTime() -
                new Date(history[i - 1].timestamp).getTime();
    if (gap > SESSION_GAP) {
      if (currentSession.length > 0) sessions.push(currentSession);
      currentSession = [];
    }
    currentSession.push(history[i]);
  }
  if (currentSession.length > 0) sessions.push(currentSession);

  if (sessions.length < MIN_OCCURRENCES) return [];

  const rituals: ForgeRitual[] = [];

  // Average engines per session
  const enginesPerSession = sessions.map(s => new Set(s.map(e => e.enginId)).size);
  const avgEngines = enginesPerSession.reduce((s, c) => s + c, 0) / enginesPerSession.length;

  if (avgEngines >= 2) {
    rituals.push({
      id: 'session-multi-engine',
      type: 'session',
      title: 'Multi-Engine Sessions',
      description: `Your sessions average ${avgEngines.toFixed(1)} engines — you naturally cross-pollinate`,
      confidence: Math.min(1, avgEngines / CREATIVE_ENGINES.length),
      accent: '#ef4444',
      emoji: '🎛️',
      engines: [],
      occurrences: sessions.length,
    });
  }

  // Average session duration
  const durations = sessions
    .filter(s => s.length >= 2)
    .map(s => {
      const first = new Date(s[0].timestamp).getTime();
      const last = new Date(s[s.length - 1].timestamp).getTime();
      return last - first;
    })
    .filter(d => d > 0);

  if (durations.length >= MIN_OCCURRENCES) {
    const avgMs = durations.reduce((s, d) => s + d, 0) / durations.length;
    const avgMin = Math.round(avgMs / 60_000);

    if (avgMin >= 5) {
      rituals.push({
        id: 'session-duration',
        type: 'session',
        title: `${avgMin}min Sessions`,
        description: `Your creative sessions average ${avgMin} minutes`,
        confidence: Math.min(1, avgMin / 60),
        accent: '#38bdf8',
        emoji: '⏱️',
        engines: [],
        occurrences: durations.length,
      });
    }
  }

  return rituals;
}

/**
 * Detect engine affinity: the user's most-used engine.
 */
export function detectAffinityPatterns(history: HistoryEntry[]): ForgeRitual[] {
  if (history.length < MIN_OCCURRENCES) return [];

  const counts = new Map<string, number>();
  for (const entry of history) {
    counts.set(entry.enginId, (counts.get(entry.enginId) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return [];

  const rituals: ForgeRitual[] = [];
  const total = history.length;

  // Top engine
  const [topId, topCount] = sorted[0];
  const topEngine = ENGIN_REGISTRY.find(e => e.id === topId);
  if (topEngine && topCount >= MIN_OCCURRENCES) {
    const ratio = topCount / total;
    rituals.push({
      id: `affinity-${topId}`,
      type: 'affinity',
      title: `${topEngine.name} Devotee`,
      description: `${topEngine.name} is your most-used engine (${Math.round(ratio * 100)}% of all activity)`,
      confidence: ratio,
      accent: topEngine.accent,
      emoji: topEngine.emoji,
      engines: [topId],
      occurrences: topCount,
    });
  }

  // Underused engines
  const creativeIds = new Set(CREATIVE_ENGINES.map(e => e.id));
  const unused = CREATIVE_ENGINES.filter(e => !counts.has(e.id));
  if (unused.length > 0 && unused.length < CREATIVE_ENGINES.length) {
    rituals.push({
      id: 'affinity-unexplored',
      type: 'affinity',
      title: 'Unexplored Territory',
      description: `You haven't tried ${unused.map(e => e.name).join(', ')} yet — consider exploring`,
      confidence: 0.3,
      accent: '#64748b',
      emoji: '🗺️',
      engines: unused.map(e => e.id),
      occurrences: 0,
    });
  }

  return rituals;
}

/**
 * Compute a full Ritual snapshot from current history data.
 */
export function computeRituals(historyOverride?: HistoryEntry[]): RitualSnapshot {
  const history = historyOverride ?? readHistory();

  const allRituals = [
    ...detectTimePatterns(history),
    ...detectSequencePatterns(history),
    ...detectSessionPatterns(history),
    ...detectAffinityPatterns(history),
  ];

  // Sort by confidence descending
  allRituals.sort((a, b) => b.confidence - a.confidence);

  return {
    rituals: allRituals,
    historySize: history.length,
    computedAt: new Date().toISOString(),
  };
}
