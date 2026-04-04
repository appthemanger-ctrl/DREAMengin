/**
 * Forge Momentum — Creative Velocity Scoring System
 *
 * Computes a composite "creative momentum" score from activity history.
 * Tracks four dimensions:
 *   1. Velocity  — how frequently the user interacts with engines
 *   2. Diversity — how many different engines they touch
 *   3. Streak    — consecutive days with at least one engine action
 *   4. Depth     — ratio of meaningful actions vs. simple navigations
 *
 * The composite score (0–100) represents overall creative momentum.
 * All data comes from the existing Forge activity history in localStorage.
 *
 * Architecture: Pure computation from forgeRegistry/forgeIntelligence data.
 * No Supabase writes — local telemetry only.
 */

import { FORGE_HISTORY_KEY } from './forgeRegistry';
import { CREATIVE_ENGINES } from './forgeRegistry';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MomentumDimension {
  /** Dimension name */
  name: string;
  /** Score 0–100 */
  score: number;
  /** Short description of what this measures */
  desc: string;
  /** Accent colour for UI */
  accent: string;
  /** Emoji */
  emoji: string;
}

export interface MomentumSnapshot {
  /** Composite score 0–100 */
  composite: number;
  /** Individual dimension scores */
  dimensions: MomentumDimension[];
  /** Current streak (consecutive days with activity) */
  streakDays: number;
  /** Engines used in the last 24h */
  enginesUsedToday: string[];
  /** Total actions in the last 24h */
  actionsToday: number;
  /** Total actions in the last 7 days */
  actionsWeek: number;
  /** Level label based on composite */
  level: MomentumLevel;
  /** Timestamp of computation */
  computedAt: string;
}

export type MomentumLevel =
  | 'DORMANT'
  | 'WARMING'
  | 'FLOWING'
  | 'BLAZING'
  | 'TRANSCENDENT';

// ── History Entry type (mirrors ForgeHistoryEntry from forgeIntelligence) ─────

interface HistoryEntry {
  enginId: string;
  label: string;
  timestamp: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;

/** Depth markers: actions containing these words count as "meaningful" */
const DEPTH_MARKERS = [
  'launched', 'created', 'composed', 'built', 'exported',
  'published', 'recorded', 'mixed', 'designed', 'coded',
  'saved', 'arranged', 'rendered', 'completed', 'deployed',
  'generated', 'analysed', 'analyzed', 'tested', 'debugged',
];

/** Actions that are just navigations (not counted as deep work) */
const SHALLOW_MARKERS = ['entered', 'activated', 'opened'];

// ── Core Computation ──────────────────────────────────────────────────────────

/**
 * Read history entries from localStorage.
 */
export function readHistory(): HistoryEntry[] {
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
 * Compute velocity score (0–100).
 * Based on actions-per-hour over the last 24 hours.
 * 10+ actions/hour = 100, scaled linearly below that.
 */
export function computeVelocity(history: HistoryEntry[]): number {
  const now = Date.now();
  const last24h = history.filter(
    e => now - new Date(e.timestamp).getTime() < MS_PER_DAY,
  );
  if (last24h.length === 0) return 0;

  // Calculate time span of activity (at least 1 hour to avoid division by tiny numbers)
  const timestamps = last24h.map(e => new Date(e.timestamp).getTime());
  const span = Math.max(now - Math.min(...timestamps), MS_PER_HOUR);
  const hoursActive = span / MS_PER_HOUR;
  const actionsPerHour = last24h.length / hoursActive;

  return Math.min(100, Math.round(actionsPerHour * 10));
}

/**
 * Compute diversity score (0–100).
 * Based on how many unique engines were used in the last 7 days.
 * Using all 6 creative engines = 100.
 */
export function computeDiversity(history: HistoryEntry[]): number {
  const now = Date.now();
  const last7d = history.filter(
    e => now - new Date(e.timestamp).getTime() < 7 * MS_PER_DAY,
  );
  const uniqueEngines = new Set(last7d.map(e => e.enginId));
  // Only count creative engine IDs
  const creativeIds = new Set(CREATIVE_ENGINES.map(e => e.id));
  const validEngines = [...uniqueEngines].filter(id => creativeIds.has(id));
  return Math.round((validEngines.length / CREATIVE_ENGINES.length) * 100);
}

/**
 * Compute streak: consecutive calendar days with at least one action,
 * counting backwards from today.
 */
export function computeStreak(history: HistoryEntry[]): number {
  if (history.length === 0) return 0;

  // Group by calendar day (UTC)
  const daySet = new Set<string>();
  for (const entry of history) {
    const d = new Date(entry.timestamp);
    daySet.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`);
  }

  // Walk backwards from today
  let streak = 0;
  const now = new Date();
  for (let offset = 0; offset < 365; offset++) {
    const d = new Date(now.getTime() - offset * MS_PER_DAY);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    if (daySet.has(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Compute depth score (0–100).
 * Ratio of "meaningful" actions to total actions in the last 7 days.
 */
export function computeDepth(history: HistoryEntry[]): number {
  const now = Date.now();
  const last7d = history.filter(
    e => now - new Date(e.timestamp).getTime() < 7 * MS_PER_DAY,
  );
  if (last7d.length === 0) return 0;

  let meaningful = 0;
  for (const entry of last7d) {
    const lower = entry.label.toLowerCase();
    const isShallow = SHALLOW_MARKERS.some(m => lower.includes(m));
    const isDeep = DEPTH_MARKERS.some(m => lower.includes(m));
    if (isDeep && !isShallow) meaningful++;
  }

  return Math.round((meaningful / last7d.length) * 100);
}

/**
 * Map composite score to a momentum level.
 */
export function getLevel(composite: number): MomentumLevel {
  if (composite >= 85) return 'TRANSCENDENT';
  if (composite >= 65) return 'BLAZING';
  if (composite >= 40) return 'FLOWING';
  if (composite >= 15) return 'WARMING';
  return 'DORMANT';
}

/**
 * Get the accent colour for a momentum level.
 */
export function getLevelColor(level: MomentumLevel): string {
  switch (level) {
    case 'TRANSCENDENT': return '#a855f7';
    case 'BLAZING':      return '#ef4444';
    case 'FLOWING':      return '#22c55e';
    case 'WARMING':      return '#fb923c';
    case 'DORMANT':      return '#64748b';
  }
}

/**
 * Get the emoji for a momentum level.
 */
export function getLevelEmoji(level: MomentumLevel): string {
  switch (level) {
    case 'TRANSCENDENT': return '🌟';
    case 'BLAZING':      return '🔥';
    case 'FLOWING':      return '🌊';
    case 'WARMING':      return '☀️';
    case 'DORMANT':      return '💤';
  }
}

/**
 * Compute a full momentum snapshot from current history data.
 */
export function computeMomentum(historyOverride?: HistoryEntry[]): MomentumSnapshot {
  const history = historyOverride ?? readHistory();
  const now = Date.now();

  const velocity = computeVelocity(history);
  const diversity = computeDiversity(history);
  const streak = computeStreak(history);
  const depth = computeDepth(history);

  // Streak score: 7+ days = 100, scaled linearly
  const streakScore = Math.min(100, Math.round((streak / 7) * 100));

  // Composite: weighted average (velocity 30%, diversity 25%, streak 25%, depth 20%)
  const composite = Math.round(
    velocity * 0.30 +
    diversity * 0.25 +
    streakScore * 0.25 +
    depth * 0.20,
  );

  const level = getLevel(composite);

  // Engines used today
  const todayEntries = history.filter(
    e => now - new Date(e.timestamp).getTime() < MS_PER_DAY,
  );
  const enginesUsedToday = [...new Set(todayEntries.map(e => e.enginId))];

  // Actions this week
  const weekEntries = history.filter(
    e => now - new Date(e.timestamp).getTime() < 7 * MS_PER_DAY,
  );

  const dimensions: MomentumDimension[] = [
    {
      name: 'Velocity',
      score: velocity,
      desc: 'Actions per hour (last 24h)',
      accent: '#38bdf8',
      emoji: '⚡',
    },
    {
      name: 'Diversity',
      score: diversity,
      desc: 'Unique engines used (last 7d)',
      accent: '#a855f7',
      emoji: '🎭',
    },
    {
      name: 'Streak',
      score: streakScore,
      desc: `${streak} consecutive day${streak !== 1 ? 's' : ''}`,
      accent: '#fb923c',
      emoji: '🔥',
    },
    {
      name: 'Depth',
      score: depth,
      desc: 'Meaningful vs. shallow actions (7d)',
      accent: '#22c55e',
      emoji: '🎯',
    },
  ];

  return {
    composite,
    dimensions,
    streakDays: streak,
    enginesUsedToday,
    actionsToday: todayEntries.length,
    actionsWeek: weekEntries.length,
    level,
    computedAt: new Date().toISOString(),
  };
}
