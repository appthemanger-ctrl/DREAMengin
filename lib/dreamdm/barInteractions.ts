// ── Split-screen divider constants ────────────────────────────────────────────
/** Fixed height (px) of the DreamDM Bar when it operates as a true split-screen divider. */
export const DIVIDER_H = 80;
/** Canonical snap points for the split-screen divider: [Dream-focus, Balanced, Surface-focus, Surface-only] */
export const SPLIT_SNAP_POINTS = [0.1, 0.5, 0.9, 1.0] as const;
/** Default split ratio — Surface Space fully dominant (DreamSpace hidden). Swipe bar up to reveal. */
export const DEFAULT_SPLIT_RATIO = 1.0;
/** Min/max reachable ratio during a drag (prevents collapsing Surface to zero; allows full DreamSpace hide). */
export const SPLIT_RATIO_MIN = 0.05;
export const SPLIT_RATIO_MAX = 1.0;
/** Fling velocity (px/ms) needed to jump one whole snap step toward the throw direction. */
export const SPLIT_FLING_VELOCITY_PX_PER_MS = 0.55;

/**
 * Returns the nearest canonical snap point for the given split ratio.
 */
export function snapToSplitPoint(ratio: number): number {
  let best: number = SPLIT_SNAP_POINTS[0];
  let bestDist = Math.abs(ratio - best);
  for (const pt of SPLIT_SNAP_POINTS) {
    const d = Math.abs(ratio - pt);
    if (d < bestDist) { bestDist = d; best = pt; }
  }
  return best;
}

/**
 * Resolves the final snap point after a drag release.
 *
 * If the fling velocity is strong enough upward (negative) or downward (positive),
 * the snap steps one increment past the nearest point in that direction, giving a
 * momentum-style feel consistent with the gold-button swipe gesture.
 */
export function snapSplitRatioOnRelease(ratio: number, velocityPxPerMs: number): number {
  const nearest = snapToSplitPoint(ratio);
  const idx = (SPLIT_SNAP_POINTS as readonly number[]).indexOf(nearest);
  if (velocityPxPerMs >= SPLIT_FLING_VELOCITY_PX_PER_MS && idx > 0) {
    // fling downward → lower split ratio (more Dream Space)
    return SPLIT_SNAP_POINTS[idx - 1];
  }
  if (velocityPxPerMs <= -SPLIT_FLING_VELOCITY_PX_PER_MS && idx < SPLIT_SNAP_POINTS.length - 1) {
    // fling upward → higher split ratio (more Surface Space)
    return SPLIT_SNAP_POINTS[idx + 1];
  }
  return nearest;
}

// ── Gold-button / bar snap constants (legacy bar-window behaviour) ─────────────
/** Matches the existing touch-friendly second-tap escalation window used by the gold button. */
export const GOLD_SECOND_TAP_WINDOW_MS = 280;
export const GOLD_TAP_SLOP_PX = 14;
export const BAR_SNAP_TO_TOP_THRESHOLD_PX = 8;
export const BAR_SNAP_TO_TOP_HEIGHT_RATIO = 0.84;
export const BAR_FLING_TO_TOP_VELOCITY_THRESHOLD_PX_PER_MS = -0.9;
export const BAR_FLING_TO_TOP_MIN_DRAG_PX = 44;
export const BAR_FLING_TO_BOTTOM_VELOCITY_THRESHOLD_PX_PER_MS = 0.9;
export const MIN_POINTER_SAMPLE_DELTA_MS = 1;

export type GoldTapAction = 'menu' | 'home' | 'home-dreamspace';

/**
 * Resolves a gold-button release into the immediate menu action or the second-tap home action.
 * A second tap inside the second-tap window escalates based on whether the bar is at the top.
 */
export function resolveGoldTapAction({
  now,
  lastTapAt,
  isTop,
}: {
  now: number;
  lastTapAt: number;
  isTop: boolean;
}): { action: GoldTapAction; nextLastTapAt: number } {
  if (now - lastTapAt < GOLD_SECOND_TAP_WINDOW_MS) {
    return {
      action: isTop ? 'home-dreamspace' : 'home',
      nextLastTapAt: 0,
    };
  }

  return { action: 'menu', nextLastTapAt: now };
}

/** Treats small pointer movement as a tap instead of a swipe or throw. */
export function shouldTreatGoldReleaseAsTap(dy: number): boolean {
  return Math.abs(dy) <= GOLD_TAP_SLOP_PX;
}

/** Returns pointer velocity in pixels per millisecond and guards same-frame samples from dividing by zero. */
export function calculatePointerVelocity(previousY: number, nextY: number, previousAt: number, nextAt: number): number {
  return (nextY - previousY) / Math.max(nextAt - previousAt, MIN_POINTER_SAMPLE_DELTA_MS);
}

/** Only a downward swipe from the top-pinned state should collapse the bar. */
export function shouldCollapseGoldSwipe({
  dy,
  isTop,
}: {
  dy: number;
  isTop: boolean;
}): boolean {
  return isTop && dy > GOLD_TAP_SLOP_PX;
}

/**
 * Snaps a bottom-origin drag to the top if it is already near the top, tall enough,
 * or thrown upward fast enough after clearing the minimum fling distance.
 */
export function shouldSnapBottomDragToTop({
  screenH,
  dragH,
  barH,
  velocityPxPerMs,
}: {
  screenH: number;
  dragH: number;
  barH: number;
  velocityPxPerMs: number;
}): boolean {
  const barTopFromScreenTop = screenH - dragH;
  return (
    barTopFromScreenTop <= BAR_SNAP_TO_TOP_THRESHOLD_PX ||
    dragH >= screenH * BAR_SNAP_TO_TOP_HEIGHT_RATIO ||
    (velocityPxPerMs <= BAR_FLING_TO_TOP_VELOCITY_THRESHOLD_PX_PER_MS &&
      dragH - barH >= BAR_FLING_TO_TOP_MIN_DRAG_PX)
  );
}

/** Collapses the expanded top panel when the user drags far enough down or throws it downward. */
export function shouldCollapseTopExpandedDrag({
  dy,
  slideDown,
  snapDownPx,
  velocityPxPerMs,
}: {
  dy: number;
  slideDown: number;
  snapDownPx: number;
  velocityPxPerMs: number;
}): boolean {
  return (
    dy > snapDownPx ||
    slideDown > snapDownPx ||
    velocityPxPerMs >= BAR_FLING_TO_BOTTOM_VELOCITY_THRESHOLD_PX_PER_MS
  );
}

// ── Minimized orb position helpers ───────────────────────────────────────────
/** Size of the minimized gold orb (px). */
export const ORB_SIZE = 48;
/** Tap slop for the minimized orb — movement below this threshold is treated as a tap. */
export const ORB_TAP_SLOP = 8;

/**
 * Clamps a minimized-orb CSS offset (right/bottom) so the orb stays fully
 * on-screen. `viewportExtent` is the viewport dimension (width for x, height for y).
 */
export function clampOrbOffset(offset: number, viewportExtent: number): number {
  return Math.max(0, Math.min(viewportExtent - ORB_SIZE, offset));
}

/**
 * Returns the new right/bottom offsets after a pointer drag of (dx, dy) pixels.
 * Positive dx = pointer moved right → "right" offset decreases.
 * Positive dy = pointer moved down  → "bottom" offset decreases.
 */
export function computeOrbDragPosition(
  startRight: number,
  startBottom: number,
  dx: number,
  dy: number,
  screenW: number,
  screenH: number,
): { x: number; y: number } {
  return {
    x: clampOrbOffset(startRight - dx, screenW),
    y: clampOrbOffset(startBottom - dy, screenH),
  };
}

// ── Mood Aura System ─────────────────────────────────────────────────────────

/**
 * Time-of-day period for the mood aura system.
 * The bar's ambient glow shifts with the sun.
 */
export type MoodPeriod = 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night';

/**
 * Determines the mood period from the current hour (0–23).
 *
 *   dawn:      5–7   — warm amber/peach
 *   morning:   8–11  — bright gold
 *   afternoon: 12–16 — sky blue
 *   dusk:      17–19 — sunset purple/orange
 *   night:     20–4  — deep indigo
 */
export function getMoodPeriod(hour: number): MoodPeriod {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h <= 7) return 'dawn';
  if (h >= 8 && h <= 11) return 'morning';
  if (h >= 12 && h <= 16) return 'afternoon';
  if (h >= 17 && h <= 19) return 'dusk';
  return 'night';
}

/** CSS gradient stops for each mood period. */
export const MOOD_AURA_GRADIENTS: Record<MoodPeriod, string> = {
  dawn:      'linear-gradient(135deg, rgba(255,183,77,0.12) 0%, rgba(255,138,101,0.08) 50%, rgba(255,209,128,0.10) 100%)',
  morning:   'linear-gradient(135deg, rgba(255,215,64,0.10) 0%, rgba(255,238,88,0.06) 50%, rgba(255,245,157,0.08) 100%)',
  afternoon: 'linear-gradient(135deg, rgba(79,195,247,0.10) 0%, rgba(129,212,250,0.06) 50%, rgba(179,229,252,0.08) 100%)',
  dusk:      'linear-gradient(135deg, rgba(206,147,216,0.12) 0%, rgba(255,138,101,0.08) 50%, rgba(186,104,200,0.10) 100%)',
  night:     'linear-gradient(135deg, rgba(63,81,181,0.12) 0%, rgba(48,63,159,0.08) 50%, rgba(92,107,192,0.10) 100%)',
};

/** Edge glow color (top/bottom bar lines) for each mood. */
export const MOOD_EDGE_COLORS: Record<MoodPeriod, string> = {
  dawn:      'rgba(255,183,77,0.55)',
  morning:   'rgba(255,215,64,0.55)',
  afternoon: 'rgba(79,195,247,0.55)',
  dusk:      'rgba(186,104,200,0.55)',
  night:     'rgba(92,107,192,0.55)',
};

// ── Surface accent colors ─────────────────────────────────────────────────────

/**
 * Surface-aware accent overlay — each surface gets a subtle color identity
 * layered over the mood aura so the bar "knows where it is."
 */
export type SurfaceAccent = 'feed' | 'messages' | 'code' | 'dreams' | 'music' | 'create' | 'discover' | 'general';

export const SURFACE_ACCENT_COLORS: Record<SurfaceAccent, string> = {
  feed:     'rgba(255,193,7,0.07)',
  messages: 'rgba(42,138,184,0.07)',
  code:     'rgba(0,200,83,0.07)',
  dreams:   'rgba(200,152,26,0.08)',
  music:    'rgba(233,30,99,0.07)',
  create:   'rgba(156,39,176,0.06)',
  discover: 'rgba(3,169,244,0.07)',
  general:  'rgba(158,158,158,0.04)',
};

// ── Slash command types ──────────────────────────────────────────────────────

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: string;  // lucide icon name hint
  category: 'navigate' | 'create' | 'utility';
  href?: string;
  action?: string;  // custom action identifier
}

/**
 * Built-in slash commands available in the DreamDM Bar.
 * Type "/" to trigger the palette.
 */
export const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'home',      label: 'Home',           description: 'Go to HomeDream feed',         icon: 'home',      category: 'navigate', href: '/homedream' },
  { id: 'games',     label: 'Games',          description: 'Open the Games Hub',           icon: 'gamepad-2', category: 'navigate', href: '/daydream/games' },
  { id: 'music',     label: 'Music Studio',   description: 'Open StarMaker music studio',  icon: 'music',     category: 'navigate', href: '/daydream/music' },
  { id: 'code',      label: 'Code Lab',       description: 'Open Code Engin IDE',          icon: 'code-2',    category: 'navigate', href: '/daydream/code' },
  { id: 'create',    label: 'Create',         description: 'Open content creator',         icon: 'sparkles',  category: 'create',   href: '/daydream/create' },
  { id: 'messages',  label: 'Messages',       description: 'Open DreamDM Messages',        icon: 'send',      category: 'navigate', href: '/messages' },
  { id: 'discover',  label: 'Discover',       description: 'Explore & discover content',   icon: 'compass',   category: 'navigate', href: '/discover' },
  { id: 'settings',  label: 'Settings',       description: 'Open platform settings',       icon: 'settings',  category: 'utility',  href: '/settings' },
  { id: 'profile',   label: 'My Profile',     description: 'View your DreamProfile',       icon: 'user',      category: 'navigate', href: '/edit-profiledream' },
  { id: 'search',    label: 'Search',         description: 'Search everything',            icon: 'search',    category: 'utility',  action: 'search-mode' },
  { id: 'dreams',    label: 'Ask Dr. Eams',   description: 'Talk to the AI assistant',     icon: 'bot',       category: 'utility',  action: 'dreams-mode' },
  { id: 'shop',      label: 'Shop',           description: 'Browse the DREAMengin shop',   icon: 'shopping-bag', category: 'navigate', href: '/shop' },
];

/**
 * Filters slash commands by a query string (after removing the leading "/").
 * Matches against label, description, and category.
 */
export function filterSlashCommands(query: string): SlashCommand[] {
  const q = query.toLowerCase().replace(/^\//, '').trim();
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q),
  );
}

// ── Typing rhythm helpers ────────────────────────────────────────────────────

/**
 * Computes a "rhythm intensity" from 0..1 based on recent keystroke timing.
 * Used to drive the drag-handle pulse animation.
 *
 *   0 = idle (no keystrokes recently)
 *   1 = maximum energy (very fast typing)
 *
 * @param recentKeystrokeTimestamps  Array of the last N keystroke timestamps (ms).
 * @param now  Current time (ms).
 * @param windowMs  Time window to consider (default 2000ms).
 */
export function computeTypingRhythm(
  recentKeystrokeTimestamps: number[],
  now: number,
  windowMs: number = 2000,
): number {
  if (recentKeystrokeTimestamps.length < 2) return 0;
  // Only consider keystrokes within the window
  const recent = recentKeystrokeTimestamps.filter((t) => now - t < windowMs);
  if (recent.length < 2) return 0;
  // Average interval between keystrokes
  let totalInterval = 0;
  for (let i = 1; i < recent.length; i++) {
    totalInterval += recent[i] - recent[i - 1];
  }
  const avgInterval = totalInterval / (recent.length - 1);
  // Map: 50ms interval (20 chars/sec) = 1.0, 500ms interval (2 chars/sec) = 0.0
  const intensity = Math.max(0, Math.min(1, 1 - (avgInterval - 50) / 450));
  return Math.round(intensity * 100) / 100;
}

/**
 * Returns a CSS width multiplier for the drag handle bar based on typing rhythm.
 * Idle = 1.0x, max rhythm = 2.5x (the handle "dances" wider).
 */
export function rhythmToHandleScale(intensity: number): number {
  return 1 + intensity * 1.5;
}

// ── Dream Streak helpers ─────────────────────────────────────────────────────

export const STREAK_STORAGE_KEY = 'de-dream-streak';

export interface StreakData {
  count: number;
  lastActiveDate: string;  // ISO date string (YYYY-MM-DD)
}

/**
 * Returns today's date as an ISO date string in local time.
 */
export function todayDateString(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Given the stored streak data and the current date, resolves the updated streak.
 *
 * Rules:
 *   - Same day as last active → no change
 *   - Consecutive day (yesterday) → increment
 *   - Gap of 2+ days → reset to 1
 *   - No existing data → start at 1
 */
export function resolveStreak(stored: StreakData | null, now: Date = new Date()): StreakData {
  const today = todayDateString(now);
  if (!stored) {
    return { count: 1, lastActiveDate: today };
  }
  if (stored.lastActiveDate === today) {
    return stored;
  }
  // Check if the stored date was yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = todayDateString(yesterday);
  if (stored.lastActiveDate === yesterdayStr) {
    return { count: stored.count + 1, lastActiveDate: today };
  }
  // Gap: reset
  return { count: 1, lastActiveDate: today };
}

/**
 * Returns the streak tier for visual styling.
 *   'none'    — 0 days
 *   'ember'   — 1–2 days (small orange flame)
 *   'fire'    — 3–6 days (bright flame)
 *   'inferno' — 7–13 days (rainbow flame)
 *   'legend'  — 14+ days (legendary golden flame with particles)
 */
export type StreakTier = 'none' | 'ember' | 'fire' | 'inferno' | 'legend';

export function getStreakTier(count: number): StreakTier {
  if (count <= 0) return 'none';
  if (count <= 2) return 'ember';
  if (count <= 6) return 'fire';
  if (count <= 13) return 'inferno';
  return 'legend';
}

// ── Quick React Emojis ───────────────────────────────────────────────────────

/**
 * Quick reaction emojis available in comment mode.
 * Each has an emoji, a label for accessibility, and a CSS animation class.
 */
export interface QuickReaction {
  emoji: string;
  label: string;
  animClass: string;
}

export const QUICK_REACTIONS: QuickReaction[] = [
  { emoji: '❤️', label: 'Love',     animClass: 'sicc-react-pop' },
  { emoji: '🔥', label: 'Fire',     animClass: 'sicc-react-pop' },
  { emoji: '💯', label: 'Perfect',  animClass: 'sicc-react-pop' },
  { emoji: '😂', label: 'Haha',     animClass: 'sicc-react-pop' },
  { emoji: '🤯', label: 'Mind blown', animClass: 'sicc-react-pop' },
  { emoji: '✨', label: 'Sparkles', animClass: 'sicc-react-pop' },
];

// ── Gold button long-press ──────────────────────────────────────────────────

/** Duration (ms) of a long-press to trigger the particle fountain. */
export const GOLD_LONG_PRESS_MS = 800;

/** Number of particles spawned by the gold button particle fountain. */
export const PARTICLE_COUNT = 24;

/**
 * Generates initial particle positions and velocities for the gold button fountain.
 * Each particle gets a random angle, speed, and color.
 */
export interface Particle {
  id: number;
  x: number;   // initial x offset from center (px)
  y: number;   // initial y offset from center (px)
  vx: number;  // velocity x (px/frame)
  vy: number;  // velocity y (px/frame, negative = up)
  size: number; // diameter (px)
  color: string;
  life: number; // 0..1 remaining
}

export function generateParticles(count: number): Particle[] {
  const colors = [
    '#f7e07a', '#e8c040', '#d4a843', '#a16207',  // golds
    '#7dd3fc', '#38bdf8', '#2a8ab8',              // blues
    '#fbbf24', '#f59e0b',                         // bright golds
    '#fffde0',                                     // white-gold
  ];
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI * 0.8) + Math.PI * 0.1; // mostly upward (10°–170°)
    const speed = 2 + Math.random() * 4;
    particles.push({
      id: i,
      x: 0,
      y: 0,
      vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy: -Math.sin(angle) * speed - 1, // bias upward
      size: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    });
  }
  return particles;
}
