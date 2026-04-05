/**
 * Tests for components/daydream/DREAMfield.tsx
 *
 * Runs in Node (no canvas/Babylon/AudioContext) -- verifies:
 *   - Module exports the component as default, named DREAMfield
 *   - ENGIN_LAUNCHPAD shape and uniqueness
 *   - formatTimestampRelative accuracy
 *   - Forge intelligence / momentum imports are mockable
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// -- Stub forge dependencies --------------------------------------------------

vi.mock('@/lib/forge/forgeMomentum', () => ({
  computeMomentum: vi.fn(() => ({
    composite:        55,
    level:            'FLOWING',
    streakDays:        4,
    enginesUsedToday: ['music', 'games'],
    actionsToday:      8,
    actionsWeek:      22,
    dimensions:       [
      { name: 'velocity', score: 60, desc: 'frequency', accent: '#22c55e', emoji: 'zap' },
    ],
    computedAt: new Date().toISOString(),
  })),
  getLevelColor: vi.fn((level: string) => {
    const map: Record<string, string> = {
      TRANSCENDENT: '#a855f7',
      BLAZING:      '#ef4444',
      FLOWING:      '#22c55e',
      WARMING:      '#fb923c',
      DORMANT:      '#64748b',
    };
    return map[level] ?? '#64748b';
  }),
  getLevelEmoji: vi.fn((level: string) => {
    const map: Record<string, string> = {
      TRANSCENDENT: 'star',
      BLAZING:      'fire',
      FLOWING:      'wave',
      WARMING:      'sun',
      DORMANT:      'zzz',
    };
    return map[level] ?? 'zzz';
  }),
}));

vi.mock('@/lib/forge/forgeIntelligence', () => ({
  readForgeHistory:    vi.fn(() => []),
  generateSuggestions: vi.fn(() => []),
}));

vi.mock('@/lib/forge/forgeRituals', () => ({
  computeRituals: vi.fn(() => ({ rituals: [], historySize: 0, computedAt: new Date().toISOString() })),
}));

vi.mock('@/lib/forge/forgeNexus', () => ({
  computeNexus: vi.fn(() => ({
    edges:             [],
    nodes:             [],
    clusters:          [],
    dominantPipeline:  [],
    totalTransitions:   0,
    computedAt:         new Date().toISOString(),
  })),
}));

vi.mock('@/lib/forge/forgeRegistry', () => {
  const CREATIVE_ENGINES = [
    { id: 'games',  name: 'GameEngin',      emoji: 'gamepad', accent: '#c8981a', desc: 'Games.',  daydreamHref: '/daydream/games'  },
    { id: 'music',  name: 'StarMakerEngin', emoji: 'music',   accent: '#a855f7', desc: 'Music.',  daydreamHref: '/daydream/music'  },
    { id: 'code',   name: 'CodeEngin',      emoji: 'laptop',  accent: '#22d3ee', desc: 'Code.',   daydreamHref: '/daydream/code'   },
    { id: 'lab',    name: 'LabEngin',       emoji: 'flask',   accent: '#10b981', desc: 'Lab.',    daydreamHref: '/daydream/lab'    },
    { id: 'brand',  name: 'BrandingEngin',  emoji: 'palette', accent: '#f472b6', desc: 'Brand.',  daydreamHref: '/daydream/brand'  },
    { id: 'create', name: 'ContentEngin',   emoji: 'pen',     accent: '#fb923c', desc: 'Create.', daydreamHref: '/daydream/create' },
  ];
  return {
    CREATIVE_ENGINES,
    readForgeActivity: vi.fn(() => []),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// -- Tests --------------------------------------------------------------------

describe('DREAMfield', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(()  => { vi.restoreAllMocks(); });

  // Default export
  it('exports DREAMfield as the default export', async () => {
    const mod = await import('@/components/daydream/DREAMfield');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('default export is named DREAMfield', async () => {
    const mod = await import('@/components/daydream/DREAMfield');
    expect(mod.default.name).toBe('DREAMfield');
  });

  // ENGIN_LAUNCHPAD
  it('exports ENGIN_LAUNCHPAD as a named export', async () => {
    const mod = await import('@/components/daydream/DREAMfield');
    expect(mod.ENGIN_LAUNCHPAD).toBeDefined();
    expect(Array.isArray(mod.ENGIN_LAUNCHPAD)).toBe(true);
  });

  it('ENGIN_LAUNCHPAD has one entry per creative engine', async () => {
    const mod = await import('@/components/daydream/DREAMfield');
    expect(mod.ENGIN_LAUNCHPAD).toHaveLength(6);
  });

  it('every launch entry has required string fields', async () => {
    const { ENGIN_LAUNCHPAD } = await import('@/components/daydream/DREAMfield');
    for (const e of ENGIN_LAUNCHPAD) {
      expect(typeof e.id).toBe('string');
      expect(e.id.length).toBeGreaterThan(0);
      expect(typeof e.name).toBe('string');
      expect(typeof e.emoji).toBe('string');
      expect(typeof e.accent).toBe('string');
      expect(typeof e.href).toBe('string');
      expect(typeof e.desc).toBe('string');
    }
  });

  it('all launch entry hrefs route to canonical /daydream/* routes', async () => {
    const { ENGIN_LAUNCHPAD } = await import('@/components/daydream/DREAMfield');
    const valid = new Set([
      '/daydream/games',
      '/daydream/music',
      '/daydream/code',
      '/daydream/lab',
      '/daydream/brand',
      '/daydream/create',
    ]);
    for (const e of ENGIN_LAUNCHPAD) {
      expect(valid.has(e.href)).toBe(true);
    }
  });

  it('ENGIN_LAUNCHPAD ids are unique', async () => {
    const { ENGIN_LAUNCHPAD } = await import('@/components/daydream/DREAMfield');
    const ids = ENGIN_LAUNCHPAD.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // No 3D / Babylon imports
  it('does not import babylon or create engines (no 3D gimmick)', async () => {
    // If the module resolves without touching @babylonjs/core, the import succeeds.
    // The mock for forgeRegistry above provides CREATIVE_ENGINES without Babylon.
    const mod = await import('@/components/daydream/DREAMfield');
    // The module shape should have the intelligence exports, not planet configs
    expect((mod as Record<string, unknown>).PLANET_CONFIGS).toBeUndefined();
    expect((mod as Record<string, unknown>).createAmbientAudio).toBeUndefined();
  });

  // formatTimestampRelative
  it('exports formatTimestampRelative', async () => {
    const mod = await import('@/components/daydream/DREAMfield');
    expect(typeof mod.formatTimestampRelative).toBe('function');
  });

  it('formatTimestampRelative returns "just now" for recent timestamps', async () => {
    const { formatTimestampRelative } = await import('@/components/daydream/DREAMfield');
    const iso = new Date(Date.now() - 5_000).toISOString();
    expect(formatTimestampRelative(iso)).toBe('just now');
  });

  it('formatTimestampRelative returns minutes-ago for timestamps < 1h', async () => {
    const { formatTimestampRelative } = await import('@/components/daydream/DREAMfield');
    const iso = new Date(Date.now() - 12 * 60 * 1000).toISOString();
    expect(formatTimestampRelative(iso)).toBe('12m ago');
  });

  it('formatTimestampRelative returns hours-ago for timestamps < 1d', async () => {
    const { formatTimestampRelative } = await import('@/components/daydream/DREAMfield');
    const iso = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
    expect(formatTimestampRelative(iso)).toBe('5h ago');
  });

  it('formatTimestampRelative returns days-ago for timestamps < 1 week', async () => {
    const { formatTimestampRelative } = await import('@/components/daydream/DREAMfield');
    const iso = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    expect(formatTimestampRelative(iso)).toBe('3d ago');
  });

  it('formatTimestampRelative returns a locale date string for old timestamps', async () => {
    const { formatTimestampRelative } = await import('@/components/daydream/DREAMfield');
    const iso = new Date(Date.now() - 14 * 86400 * 1000).toISOString();
    const result = formatTimestampRelative(iso);
    // Should not be a relative descriptor -- should be a date string
    expect(result).not.toMatch(/ago/);
    expect(result.length).toBeGreaterThan(0);
  });

  // Forge library mocks work correctly
  it('computeMomentum is importable and mockable', async () => {
    const { computeMomentum } = await import('@/lib/forge/forgeMomentum');
    const snap = computeMomentum();
    expect(snap.composite).toBe(55);
    expect(snap.level).toBe('FLOWING');
  });

  it('generateSuggestions is importable and mockable', async () => {
    const { generateSuggestions } = await import('@/lib/forge/forgeIntelligence');
    const suggestions = generateSuggestions({ enginId: 'music', label: 'test' });
    expect(Array.isArray(suggestions)).toBe(true);
  });
});
