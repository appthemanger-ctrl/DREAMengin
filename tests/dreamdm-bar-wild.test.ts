/**
 * tests/dreamdm-bar-wild.test.ts
 *
 * Tests for the 6 wild DreamDM Bar features:
 *   1. Mood Aura System (time-of-day + surface-aware ambient theming)
 *   2. Slash Commands (inline command palette)
 *   3. Gold Button Long-Press Particle Fountain
 *   4. Typing Rhythm Visualizer
 *   5. Dream Streak Counter
 *   6. Quick React Emoji Row
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  getMoodPeriod,
  MOOD_AURA_GRADIENTS,
  MOOD_EDGE_COLORS,
  SURFACE_ACCENT_COLORS,
  filterSlashCommands,
  SLASH_COMMANDS,
  computeTypingRhythm,
  rhythmToHandleScale,
  resolveStreak,
  todayDateString,
  getStreakTier,
  STREAK_STORAGE_KEY,
  QUICK_REACTIONS,
  GOLD_LONG_PRESS_MS,
  PARTICLE_COUNT,
  generateParticles,
  type MoodPeriod,
  type StreakData,
  type StreakTier,
} from '@/lib/dreamdm/barInteractions';

// ── Mood Aura System ─────────────────────────────────────────────────────────

describe('getMoodPeriod', () => {
  it('returns dawn for hours 5–7', () => {
    expect(getMoodPeriod(5)).toBe('dawn');
    expect(getMoodPeriod(6)).toBe('dawn');
    expect(getMoodPeriod(7)).toBe('dawn');
  });

  it('returns morning for hours 8–11', () => {
    expect(getMoodPeriod(8)).toBe('morning');
    expect(getMoodPeriod(11)).toBe('morning');
  });

  it('returns afternoon for hours 12–16', () => {
    expect(getMoodPeriod(12)).toBe('afternoon');
    expect(getMoodPeriod(14)).toBe('afternoon');
    expect(getMoodPeriod(16)).toBe('afternoon');
  });

  it('returns dusk for hours 17–19', () => {
    expect(getMoodPeriod(17)).toBe('dusk');
    expect(getMoodPeriod(19)).toBe('dusk');
  });

  it('returns night for hours 20–4', () => {
    expect(getMoodPeriod(20)).toBe('night');
    expect(getMoodPeriod(23)).toBe('night');
    expect(getMoodPeriod(0)).toBe('night');
    expect(getMoodPeriod(4)).toBe('night');
  });

  it('handles negative hours via modulo wrap', () => {
    expect(getMoodPeriod(-1)).toBe('night'); // wraps to 23
    expect(getMoodPeriod(-6)).toBe('dusk');  // wraps to 18
  });

  it('handles hours ≥ 24 via modulo wrap', () => {
    expect(getMoodPeriod(26)).toBe('night'); // wraps to 2
    expect(getMoodPeriod(32)).toBe('morning'); // wraps to 8
  });
});

describe('Mood Aura gradient/edge maps', () => {
  it('has a gradient for every mood period', () => {
    const periods: MoodPeriod[] = ['dawn', 'morning', 'afternoon', 'dusk', 'night'];
    for (const p of periods) {
      expect(MOOD_AURA_GRADIENTS[p]).toBeDefined();
      expect(MOOD_AURA_GRADIENTS[p]).toContain('linear-gradient');
    }
  });

  it('has an edge color for every mood period', () => {
    const periods: MoodPeriod[] = ['dawn', 'morning', 'afternoon', 'dusk', 'night'];
    for (const p of periods) {
      expect(MOOD_EDGE_COLORS[p]).toBeDefined();
      expect(MOOD_EDGE_COLORS[p]).toContain('rgba');
    }
  });
});

describe('Surface accent colors', () => {
  it('covers all 8 surfaces', () => {
    const surfaces = ['feed', 'messages', 'code', 'dreams', 'music', 'create', 'discover', 'general'] as const;
    for (const s of surfaces) {
      expect(SURFACE_ACCENT_COLORS[s]).toBeDefined();
      expect(SURFACE_ACCENT_COLORS[s]).toContain('rgba');
    }
  });

  it('each accent is distinct', () => {
    const values = Object.values(SURFACE_ACCENT_COLORS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

// ── Slash Commands ──────────────────────────────────────────────────────────

describe('SLASH_COMMANDS', () => {
  it('has at least 10 commands', () => {
    expect(SLASH_COMMANDS.length).toBeGreaterThanOrEqual(10);
  });

  it('every command has id, label, description, icon, category', () => {
    for (const cmd of SLASH_COMMANDS) {
      expect(cmd.id).toBeTruthy();
      expect(cmd.label).toBeTruthy();
      expect(cmd.description).toBeTruthy();
      expect(cmd.icon).toBeTruthy();
      expect(['navigate', 'create', 'utility']).toContain(cmd.category);
    }
  });

  it('every command has either href or action', () => {
    for (const cmd of SLASH_COMMANDS) {
      expect(cmd.href ?? cmd.action).toBeTruthy();
    }
  });

  it('has unique ids', () => {
    const ids = SLASH_COMMANDS.map(c => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe('filterSlashCommands', () => {
  it('returns all commands for empty query', () => {
    expect(filterSlashCommands('')).toEqual(SLASH_COMMANDS);
  });

  it('returns all commands for "/" alone', () => {
    expect(filterSlashCommands('/')).toEqual(SLASH_COMMANDS);
  });

  it('filters by label', () => {
    const results = filterSlashCommands('game');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.label.toLowerCase().includes('game'))).toBe(true);
  });

  it('filters by description', () => {
    const results = filterSlashCommands('starmaker');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.description.toLowerCase().includes('starmaker'))).toBe(true);
  });

  it('is case-insensitive', () => {
    const upper = filterSlashCommands('HOME');
    const lower = filterSlashCommands('home');
    expect(upper.length).toBe(lower.length);
  });

  it('returns empty for a query matching nothing', () => {
    expect(filterSlashCommands('zzzzzzzznonexistent')).toHaveLength(0);
  });

  it('strips leading "/" from query before matching', () => {
    const withSlash = filterSlashCommands('/music');
    const without = filterSlashCommands('music');
    expect(withSlash.length).toBe(without.length);
  });
});

// ── Typing Rhythm Visualizer ─────────────────────────────────────────────────

describe('computeTypingRhythm', () => {
  it('returns 0 for fewer than 2 keystrokes', () => {
    expect(computeTypingRhythm([], 1000)).toBe(0);
    expect(computeTypingRhythm([1000], 1000)).toBe(0);
  });

  it('returns 0 when all keystrokes are outside the window', () => {
    expect(computeTypingRhythm([100, 200], 5000, 2000)).toBe(0);
  });

  it('returns high intensity for fast typing (short intervals)', () => {
    // 10 keystrokes at 60ms intervals = fast
    const times = [1000, 1060, 1120, 1180, 1240, 1300, 1360, 1420, 1480, 1540];
    const result = computeTypingRhythm(times, 1550);
    expect(result).toBeGreaterThan(0.7);
  });

  it('returns low intensity for slow typing (long intervals)', () => {
    const times = [1000, 1500, 2000, 2500];
    const result = computeTypingRhythm(times, 2600);
    expect(result).toBeLessThan(0.15);
  });

  it('returns value clamped between 0 and 1', () => {
    // Even with extremely fast typing
    const times = [1000, 1010, 1020, 1030, 1040, 1050];
    const result = computeTypingRhythm(times, 1055);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});

describe('rhythmToHandleScale', () => {
  it('returns 1.0 for zero intensity', () => {
    expect(rhythmToHandleScale(0)).toBe(1);
  });

  it('returns 2.5 for maximum intensity', () => {
    expect(rhythmToHandleScale(1)).toBe(2.5);
  });

  it('scales linearly', () => {
    expect(rhythmToHandleScale(0.5)).toBe(1.75);
  });
});

// ── Dream Streak Counter ────────────────────────────────────────────────────

describe('todayDateString', () => {
  it('returns an ISO date string in YYYY-MM-DD format', () => {
    const result = todayDateString(new Date('2026-04-04T12:00:00Z'));
    expect(result).toBe('2026-04-04');
  });
});

describe('resolveStreak', () => {
  it('starts at 1 when no stored data exists', () => {
    const result = resolveStreak(null, new Date('2026-04-04T12:00:00Z'));
    expect(result.count).toBe(1);
    expect(result.lastActiveDate).toBe('2026-04-04');
  });

  it('keeps the same count when visiting on the same day', () => {
    const stored: StreakData = { count: 5, lastActiveDate: '2026-04-04' };
    const result = resolveStreak(stored, new Date('2026-04-04T18:00:00Z'));
    expect(result.count).toBe(5);
  });

  it('increments the count for a consecutive day visit', () => {
    const stored: StreakData = { count: 5, lastActiveDate: '2026-04-03' };
    const result = resolveStreak(stored, new Date('2026-04-04T08:00:00Z'));
    expect(result.count).toBe(6);
    expect(result.lastActiveDate).toBe('2026-04-04');
  });

  it('resets to 1 when there is a gap of 2+ days', () => {
    const stored: StreakData = { count: 10, lastActiveDate: '2026-04-01' };
    const result = resolveStreak(stored, new Date('2026-04-04T08:00:00Z'));
    expect(result.count).toBe(1);
  });
});

describe('getStreakTier', () => {
  it('returns none for 0', () => {
    expect(getStreakTier(0)).toBe('none');
  });

  it('returns ember for 1–2', () => {
    expect(getStreakTier(1)).toBe('ember');
    expect(getStreakTier(2)).toBe('ember');
  });

  it('returns fire for 3–6', () => {
    expect(getStreakTier(3)).toBe('fire');
    expect(getStreakTier(6)).toBe('fire');
  });

  it('returns inferno for 7–13', () => {
    expect(getStreakTier(7)).toBe('inferno');
    expect(getStreakTier(13)).toBe('inferno');
  });

  it('returns legend for 14+', () => {
    expect(getStreakTier(14)).toBe('legend');
    expect(getStreakTier(100)).toBe('legend');
  });

  it('returns none for negative counts', () => {
    expect(getStreakTier(-1)).toBe('none');
  });
});

describe('STREAK_STORAGE_KEY', () => {
  it('is a non-empty string', () => {
    expect(typeof STREAK_STORAGE_KEY).toBe('string');
    expect(STREAK_STORAGE_KEY.length).toBeGreaterThan(0);
  });

  it('does not collide with the DM draft prefix', () => {
    expect(STREAK_STORAGE_KEY).not.toContain('de-dm-draft:');
  });
});

// ── Quick React Emoji Row ──────────────────────────────────────────────────

describe('QUICK_REACTIONS', () => {
  it('has at least 5 reactions', () => {
    expect(QUICK_REACTIONS.length).toBeGreaterThanOrEqual(5);
  });

  it('every reaction has emoji, label, and animClass', () => {
    for (const r of QUICK_REACTIONS) {
      expect(r.emoji).toBeTruthy();
      expect(r.label).toBeTruthy();
      expect(r.animClass).toBeTruthy();
    }
  });

  it('has unique emojis', () => {
    const emojis = QUICK_REACTIONS.map(r => r.emoji);
    const unique = new Set(emojis);
    expect(unique.size).toBe(emojis.length);
  });
});

// ── Gold Button Long-Press ──────────────────────────────────────────────────

describe('GOLD_LONG_PRESS_MS', () => {
  it('is 800ms', () => {
    expect(GOLD_LONG_PRESS_MS).toBe(800);
  });
});

describe('generateParticles', () => {
  it('generates the requested number of particles', () => {
    expect(generateParticles(10).length).toBe(10);
    expect(generateParticles(24).length).toBe(24);
    expect(generateParticles(0).length).toBe(0);
  });

  it('every particle has valid properties', () => {
    const particles = generateParticles(20);
    for (const p of particles) {
      expect(typeof p.id).toBe('number');
      expect(typeof p.x).toBe('number');
      expect(typeof p.y).toBe('number');
      expect(typeof p.vx).toBe('number');
      expect(typeof p.vy).toBe('number');
      expect(p.vy).toBeLessThan(0); // particles fly upward
      expect(p.size).toBeGreaterThan(0);
      expect(p.color).toBeTruthy();
      expect(p.life).toBe(1);
    }
  });

  it('particles have unique ids', () => {
    const particles = generateParticles(24);
    const ids = particles.map(p => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('particles have varied velocities (not all identical)', () => {
    const particles = generateParticles(10);
    const vxSet = new Set(particles.map(p => p.vx));
    // With randomness, extremely unlikely all 10 have the same vx
    expect(vxSet.size).toBeGreaterThan(1);
  });
});
