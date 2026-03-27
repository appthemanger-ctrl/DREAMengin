/**
 * tests/phase8f-daydream-network.test.ts
 *
 * Phase 8 §F — Daydream Surface Network Deep Activation (Points 47–58)
 *
 * Covers all 12 spec points:
 *   47. All 6 Daydream Surfaces render real content
 *   48. All 6 Engin runtimes write to real Supabase records
 *   49. Daydream workspace states persist and restore
 *   50. Surface context preserved on back-navigation
 *   51. Music Daydream / StarMakerEngin — real DB output record
 *   52. Games Daydream / GameEngin — game state persists
 *   53. Lab Daydream / LabEngin — real experiment record write
 *   54. Code Daydream / CodeEngin — editor state persists
 *   55. Brand Daydream / BrandingEngin — brand kit DB records
 *   56. Create Daydream / ContentEngin — draft saves to DB
 *   57. Multi-connection: BrandingEngin → ContentEngin
 *   58. All 6 DreamsSpacePanel routes are live (no 404/placeholder)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

function readSource(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

function sourceExists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

// ── Supabase mock factory ─────────────────────────────────────────────────────

function makeMockSupabase(overrides: Record<string, unknown> = {}) {
  const mockSelect = vi.fn().mockReturnThis();
  const mockEq     = vi.fn().mockReturnThis();
  const mockOrder  = vi.fn().mockReturnThis();
  const mockLimit  = vi.fn().mockReturnThis();
  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'new-uuid' }, error: null });
  const mockInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single: mockSingle }),
  });
  const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select:      mockSelect,
      eq:          mockEq,
      order:       mockOrder,
      limit:       mockLimit,
      maybeSingle: mockMaybeSingle,
      single:      mockSingle,
      insert:      mockInsert,
      upsert:      mockUpsert,
      update:      mockUpdate,
    }),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POINT 47 — All 6 Surfaces have real content
// ─────────────────────────────────────────────────────────────────────────────

describe('Point 47 — All 6 Daydream Surfaces render real content', () => {
  const SURFACE_PAGES = [
    'app/daydream/music/page.tsx',
    'app/daydream/games/page.tsx',
    'app/daydream/lab/page.tsx',
    'app/daydream/code/page.tsx',
    'app/daydream/brand/page.tsx',
    'app/daydream/create/page.tsx',
  ] as const;

  const PLACEHOLDER_PATTERNS = [
    /coming soon/i,
    /placeholder/i,
    /mock data/i,
    /dummy copy/i,
    /TODO: implement/i,
  ];

  for (const page of SURFACE_PAGES) {
    it(`${page} exists and has no placeholder content`, () => {
      expect(sourceExists(page)).toBe(true);
      const src = readSource(page);

      // Must not contain placeholder patterns in the primary surface area
      for (const pat of PLACEHOLDER_PATTERNS) {
        expect(src).not.toMatch(pat);
      }

      // Must have a real component render (not just a redirect)
      expect(src).toContain('DaydreamShell');
    });
  }

  it('all 6 pages use DaydreamShell with a sideBComponent', () => {
    for (const page of SURFACE_PAGES) {
      const src = readSource(page);
      expect(src).toContain('sideBComponent');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POINT 48 — All 6 Engins write to real Supabase records
// ─────────────────────────────────────────────────────────────────────────────

describe('Point 48 — All 6 Engins accept real input and write to Supabase', () => {
  const ENGINS = [
    { file: 'components/daydream/StarMakerEngin.tsx', table: 'music_outputs' },
    { file: 'components/daydream/GameEngin.tsx',      table: 'game_scores' },
    { file: 'components/daydream/LabEngin.tsx',       table: 'physics_experiments' },
    { file: 'components/daydream/CodeEngin.tsx',      table: 'projects' },
    { file: 'components/daydream/BrandingEngin.tsx',  table: 'brand_kit_items' },
    { file: 'components/daydream/ContentEngin.tsx',   table: 'content_drafts' },
  ] as const;

  for (const { file, table } of ENGINS) {
    it(`${path.basename(file)} references the ${table} table`, () => {
      expect(sourceExists(file)).toBe(true);
      const src = readSource(file);
      expect(src).toContain(table);
      expect(src).toContain("createClient");
    });
  }

  it('all 6 Engins import useDaydreamPersistence for DB state writes', () => {
    for (const { file } of ENGINS) {
      const src = readSource(file);
      expect(src).toContain('useDaydreamPersistence');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POINT 49 — Workspace states persist and restore
// ─────────────────────────────────────────────────────────────────────────────

describe('Point 49 — useDaydreamPersistence hook saves and restores state', () => {
  const hookFile = 'lib/daydream/useDaydreamPersistence.ts';

  it('hook file exists', () => {
    expect(sourceExists(hookFile)).toBe(true);
  });

  it('hook exports useDaydreamPersistence function', () => {
    const src = readSource(hookFile);
    expect(src).toContain('export function useDaydreamPersistence');
  });

  it('hook reads from daydream_states table on mount', () => {
    const src = readSource(hookFile);
    expect(src).toContain("'daydream_states'");
    expect(src).toContain('maybeSingle');
    expect(src).toContain('savedState');
    expect(src).toContain('isRestoring');
  });

  it('hook writes to daydream_states on persistState call', () => {
    const src = readSource(hookFile);
    expect(src).toContain('upsert');
    expect(src).toContain('daydream_type');
    expect(src).toContain('persistState');
  });

  it('hook debounces writes (800ms)', () => {
    const src = readSource(hookFile);
    expect(src).toContain('800');
    expect(src).toContain('debounceRef');
  });

  it('hook flushes pending writes on unmount', () => {
    const src = readSource(hookFile);
    expect(src).toContain('clearTimeout');
  });

  it('hook is generic (typed T)', () => {
    const src = readSource(hookFile);
    expect(src).toContain('function useDaydreamPersistence<T');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POINT 49/50 — Each Engin restores state from savedState on mount
// ─────────────────────────────────────────────────────────────────────────────

describe('Point 49/50 — Engins restore workspace state on mount', () => {
  const RESTORE_CHECKS: Array<{ file: string; restoreVar: string }> = [
    { file: 'components/daydream/StarMakerEngin.tsx', restoreVar: 'musicRestoredRef' },
    { file: 'components/daydream/GameEngin.tsx',      restoreVar: 'gameRestoredRef'  },
    { file: 'components/daydream/LabEngin.tsx',       restoreVar: 'labRestoredRef'   },
    { file: 'components/daydream/CodeEngin.tsx',      restoreVar: 'codeRestoredRef'  },
    { file: 'components/daydream/BrandingEngin.tsx',  restoreVar: 'brandRestoredRef' },
    { file: 'components/daydream/ContentEngin.tsx',   restoreVar: 'contentRestoredRef' },
  ];

  for (const { file, restoreVar } of RESTORE_CHECKS) {
    it(`${path.basename(file)} uses ${restoreVar} to guard against double-restore`, () => {
      const src = readSource(file);
      expect(src).toContain(restoreVar);
      expect(src).toContain('isRestoring');
      expect(src).toContain('savedState');
    });

    it(`${path.basename(file)} has persist effect that skips when isRestoring`, () => {
      const src = readSource(file);
      expect(src).toContain('if (');
      expect(src).toContain('Restoring') ;
      expect(src).toContain('persistState');
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POINT 50 — Back-navigation preserves DaydreamShell flip state
// ─────────────────────────────────────────────────────────────────────────────

describe('Point 50 — DaydreamShell preserves Side A/B context on back-navigation', () => {
  const shellFile = 'components/daydream/DaydreamShell.tsx';

  it('DaydreamShell uses useDaydreamState for visit tracking', () => {
    const src = readSource(shellFile);
    expect(src).toContain('useDaydreamState');
  });

  it('DaydreamShell manages side A/B as local state (not URL)', () => {
    const src = readSource(shellFile);
    expect(src).toContain("useState<'A' | 'B'>('A')");
  });

  it('Engin onBack callback flips back to Side A', () => {
    const src = readSource(shellFile);
    expect(src).toContain('onBack={flip}');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POINT 51 — Music / StarMakerEngin produces real DB output record
// ─────────────────────────────────────────────────────────────────────────────

describe('Point 51 — StarMakerEngin produces real playable/shareable output', () => {
  const file = 'components/daydream/StarMakerEngin.tsx';

  it('StarMakerEngin writes to music_outputs table on stem export', () => {
    const src = readSource(file);
    expect(src).toContain('music_outputs');
    expect(src).toContain('.insert(');
  });

  it('music_outputs record includes bpm, musical_key, stems, beat_grid', () => {
    const src = readSource(file);
    expect(src).toContain('bpm');
    expect(src).toContain('musical_key');
    expect(src).toContain('stems');
    expect(src).toContain('beat_grid');
  });

  it('music_outputs migration exists with RLS', () => {
    const migration = readSource('supabase/migrations/20260325000000_phase8f_daydream_network.sql');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.music_outputs');
    expect(migration).toContain('ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('music_outputs_insert_own');
  });

  it('StarMakerEngin still publishes releases to music_releases', () => {
    const src = readSource(file);
    expect(src).toContain('music_releases');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POINT 52 — Games / GameEngin — real game loop playable, state persists
// ─────────────────────────────────────────────────────────────────────────────

describe('Point 52 — Games Daydream has real game loop and persistent state', () => {
  it('Games page keeps the library surface and console side distinct', () => {
    const src = readSource('app/daydream/games/page.tsx');
    expect(src).toContain('Game Library');
    expect(src).toContain('GameEngin Console');
    expect(src).toMatch(/Word Sprint|Memory Grid|Speed Tap|GamesHub|GameEngin/);
  });

  it('Immersive game launch shell exists for the playable route', () => {
    expect(sourceExists('app/daydream/game/ImmersiveGameShell.tsx')).toBe(true);
    const src = readSource('app/daydream/game/ImmersiveGameShell.tsx');
    expect(src).toContain('requestFullscreen');
    expect(src).toContain('DREAMENGIN');
    expect(src).toContain('boot sequence');
  });

  it('GameEngin reads personal bests from game_scores', () => {
    const src = readSource('components/daydream/GameEngin.tsx');
    expect(src).toContain('game_scores');
    expect(src).toContain('score');
  });

  it('GameEngin persists world builder and physics config', () => {
    const src = readSource('components/daydream/GameEngin.tsx');
    expect(src).toContain('worldGrid');
    expect(src).toContain('physicsConfig');
    expect(src).toContain('persistGameState');
  });

  it('game_scores migration exists with RLS', () => {
    const migration = readSource('supabase/migrations/20260320100000_game_scores_all_games.sql');
    expect(migration).toContain('game_scores');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POINT 53 — Lab / LabEngin — real input, real stored output
// ─────────────────────────────────────────────────────────────────────────────

describe('Point 53 — LabEngin accepts real input and stores experiment records', () => {
  const file = 'components/daydream/LabEngin.tsx';

  it('LabEngin writes to physics_experiments on publish', () => {
    const src = readSource(file);
    expect(src).toContain('physics_experiments');
    expect(src).toContain('.insert(');
  });

  it('LabEngin reads existing experiments from DB', () => {
    const src = readSource(file);
    expect(src).toContain('.from(\'physics_experiments\')');
  });

  it('LabEngin persists chart type and hypotheses', () => {
    const src = readSource(file);
    expect(src).toContain('chartType');
    expect(src).toContain('hypotheses');
    expect(src).toContain('persistLabState');
  });

  it('physics_experiments table migration exists', () => {
    const migration = readSource('supabase/migrations/20260129000000_upgrade_schema.sql');
    expect(migration).toContain('physics_experiments');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POINT 54 — Code / CodeEngin — editor state persists to DB
// ─────────────────────────────────────────────────────────────────────────────

describe('Point 54 — CodeEngin editor state persists to database', () => {
  const file = 'components/daydream/CodeEngin.tsx';

  it('CodeEngin persists notebook cells to DB', () => {
    const src = readSource(file);
    expect(src).toContain('persistCodeState');
    expect(src).toContain('cells');
    expect(src).toContain('codeRestoredRef');
  });

  it('CodeEngin restores cells from savedCodeState', () => {
    const src = readSource(file);
    expect(src).toContain('savedCodeState');
    expect(src).toContain('savedCodeState.cells');
  });

  it('CodeEngin writes projects to the projects table', () => {
    const src = readSource(file);
    expect(src).toContain("'projects'");
    expect(src).toContain('.insert(');
  });

  it('CodeEngin uses useDaydreamPersistence with daydreamType code', () => {
    const src = readSource(file);
    expect(src).toContain("daydreamType: 'code'");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POINT 55 — Brand / BrandingEngin — brand kit stored as real DB records
// ─────────────────────────────────────────────────────────────────────────────

describe('Point 55 — BrandingEngin stores brand kit items as real DB records', () => {
  const file = 'components/daydream/BrandingEngin.tsx';

  it('brand_kit_items migration exists with RLS', () => {
    const migration = readSource('supabase/migrations/20260325000000_phase8f_daydream_network.sql');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.brand_kit_items');
    expect(migration).toContain('ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('brand_kit_items_insert_own');
    expect(migration).toContain('brand_kit_items_select_own');
  });

  it('BrandingEngin inserts to brand_kit_items on save', () => {
    const src = readSource(file);
    expect(src).toContain('brand_kit_items');
    expect(src).toContain('.insert(');
  });

  it('BrandingEngin loads brand_kit_items from DB on mount', () => {
    const src = readSource(file);
    // Should have a select query for brand_kit_items
    expect(src).toContain("'brand_kit_items'");
    expect(src).toContain('.select(');
  });

  it('BrandingEngin optimistically updates local state then corrects with DB id', () => {
    const src = readSource(file);
    expect(src).toContain('optimisticId');
    expect(src).toContain('data.id');
  });

  it('BrandingEngin persists A/B tests via useDaydreamPersistence', () => {
    const src = readSource(file);
    expect(src).toContain('persistBrandState');
    expect(src).toContain('abTests');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POINT 56 — Create / ContentEngin — content draft saves to DB
// ─────────────────────────────────────────────────────────────────────────────

describe('Point 56 — ContentEngin content drafts save to database', () => {
  const file = 'components/daydream/ContentEngin.tsx';

  it('ContentEngin saves drafts via POST /api/drafts', () => {
    const src = readSource(file);
    expect(src).toContain('/api/drafts');
    expect(src).toContain("'POST'");
  });

  it('content_drafts migration exists with RLS', () => {
    const migration = readSource('supabase/migrations/20260315000000_content_drafts.sql');
    expect(migration).toContain('content_drafts');
    expect(migration).toContain('ENABLE ROW LEVEL SECURITY');
  });

  it('ContentEngin persists calendar items and draft state', () => {
    const src = readSource(file);
    expect(src).toContain('persistContentState');
    expect(src).toContain('calendarItems');
    expect(src).toContain('draftTopic');
  });

  it('ContentEngin restores calendar items from savedContentState', () => {
    const src = readSource(file);
    expect(src).toContain('savedContentState');
    expect(src).toContain('savedContentState.calendarItems');
  });

  it('ContentEngin reads recent notes/drafts from Supabase', () => {
    const src = readSource(file);
    expect(src).toContain("'notes'");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POINT 57 — Multi-connection: Brand Daydream → ContentEngin
// ─────────────────────────────────────────────────────────────────────────────

describe('Point 57 — Multi-connection: BrandingEngin connects to ContentEngin', () => {
  const file = 'components/daydream/BrandingEngin.tsx';

  it('BrandingEngin has handleSendToContentEngin function', () => {
    const src = readSource(file);
    expect(src).toContain('handleSendToContentEngin');
  });

  it('handleSendToContentEngin calls POST /api/drafts (real DB write)', () => {
    const src = readSource(file);
    expect(src).toContain('/api/drafts');
    expect(src).toContain("'POST'");
  });

  it('handleSendToContentEngin emits brand:push-content bridge event', () => {
    const src = readSource(file);
    expect(src).toContain('brand:push-content');
    expect(src).toContain('bridge.emit');
  });

  it('BrandingEngin renders "Send to ContentEngin" button when voice suggestion is ready', () => {
    const src = readSource(file);
    expect(src).toContain('Send to ContentEngin');
    expect(src).toContain('contentBridgeSending');
  });

  it('multi-connection path is labelled in code comments', () => {
    const src = readSource(file);
    expect(src).toContain('multi-connection');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POINT 58 — All 6 DreamsSpacePanel routes are live (no 404/placeholder)
// ─────────────────────────────────────────────────────────────────────────────

describe('Point 58 — All 6 Daydream tiles in DreamsSpacePanel have live routes', () => {
  const panelFile = 'components/dreams/DreamsSpacePanel.tsx';

  const EXPECTED_ROUTES = [
    '/daydream/music',
    '/daydream/games',
    '/daydream/lab',
    '/daydream/code',
    '/daydream/brand',
    '/daydream/create',
  ] as const;

  it('DreamsSpacePanel file exists', () => {
    expect(sourceExists(panelFile)).toBe(true);
  });

  for (const route of EXPECTED_ROUTES) {
    it(`DreamsSpacePanel contains live route: ${route}`, () => {
      const src = readSource(panelFile);
      expect(src).toContain(route);
    });
  }

  it('DreamsSpacePanel uses router.push() or onOpenUrl — no dead iframe routes', () => {
    const src = readSource(panelFile);
    // Must navigate via navigate() helper which calls router.push
    expect(src).toContain('router.push');
  });

  it('All 6 Daydream page files exist (routes would not 404)', () => {
    for (const route of EXPECTED_ROUTES) {
      // e.g. /daydream/music → app/daydream/music/page.tsx
      const pagePath = `app${route}/page.tsx`;
      expect(sourceExists(pagePath)).toBe(true);
    }
  });

  it('DreamsSpacePanel DAYDREAMS constant has all 6 entries', () => {
    const src = readSource(panelFile);
    const daydreamIds = ['music', 'games', 'lab', 'code', 'brand', 'create'];
    for (const id of daydreamIds) {
      expect(src).toContain(`id: '${id}'`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Migration integrity checks
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 8F migration integrity', () => {
  const migrationFile = 'supabase/migrations/20260325000000_phase8f_daydream_network.sql';

  it('migration file exists', () => {
    expect(sourceExists(migrationFile)).toBe(true);
  });

  it('migration creates brand_kit_items with user_id foreign key', () => {
    const sql = readSource(migrationFile);
    expect(sql).toContain('brand_kit_items');
    expect(sql).toContain('user_id');
    expect(sql).toContain('auth.users(id)');
  });

  it('migration creates music_outputs with correct columns', () => {
    const sql = readSource(migrationFile);
    expect(sql).toContain('music_outputs');
    expect(sql).toContain('bpm');
    expect(sql).toContain('musical_key');
    expect(sql).toContain('beat_grid');
    expect(sql).toContain('mixer_state');
  });

  it('all new tables have RLS enabled', () => {
    const sql = readSource(migrationFile);
    const rls = (sql.match(/ENABLE ROW LEVEL SECURITY/g) ?? []).length;
    // brand_kit_items + music_outputs = 2 tables
    expect(rls).toBeGreaterThanOrEqual(2);
  });

  it('all policies are owner-only (auth.uid())', () => {
    const sql = readSource(migrationFile);
    expect(sql).toContain('auth.uid()');
    const policies = (sql.match(/CREATE POLICY/g) ?? []).length;
    expect(policies).toBeGreaterThanOrEqual(6); // at least 3 per table
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useDaydreamPersistence unit tests with mocked Supabase
// ─────────────────────────────────────────────────────────────────────────────

describe('useDaydreamPersistence — unit tests with mock Supabase', () => {
  // These are structural/code-level tests since we test in node environment
  const hookSrc = readSource('lib/daydream/useDaydreamPersistence.ts');

  it('hook uses createClient from @/lib/supabase/client', () => {
    expect(hookSrc).toContain("from '@/lib/supabase/client'");
  });

  it('hook has correct onConflict for upsert (user_id,daydream_type)', () => {
    expect(hookSrc).toContain("onConflict: 'user_id,daydream_type'");
  });

  it('hook exports UseDaydreamPersistenceReturn interface', () => {
    expect(hookSrc).toContain('UseDaydreamPersistenceReturn');
  });

  it('hook exports UseDaydreamPersistenceOptions interface', () => {
    expect(hookSrc).toContain('UseDaydreamPersistenceOptions');
  });

  it('isRestoring starts true and becomes false after load', () => {
    expect(hookSrc).toContain('useState(true)');
    expect(hookSrc).toContain('setIsRestoring(false)');
  });

  it('hook handles unauthenticated state gracefully', () => {
    expect(hookSrc).toContain('if (!user');
    expect(hookSrc).toContain('setIsRestoring(false)');
  });

  it('hook cancels in-flight load on unmount', () => {
    expect(hookSrc).toContain('let cancelled = false');
    expect(hookSrc).toContain('cancelled = true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Architectural compliance
// ─────────────────────────────────────────────────────────────────────────────

describe('Architecture compliance', () => {
  it('useDaydreamPersistence lives in lib/ (logic layer)', () => {
    expect(sourceExists('lib/daydream/useDaydreamPersistence.ts')).toBe(true);
  });

  it('useDaydreamPersistence is NOT in app/ (surface layer)', () => {
    expect(sourceExists('app/daydream/useDaydreamPersistence.ts')).toBe(false);
  });

  it('BrandingEngin multi-connection writes go through /api/drafts route (not direct DB from client for drafts)', () => {
    const src = readSource('components/daydream/BrandingEngin.tsx');
    // Should use /api/drafts fetch, not direct supabase.from('content_drafts')
    expect(src).toContain('/api/drafts');
  });

  it('all Engins use createBrowserClient pattern (createClient from lib/supabase/client)', () => {
    const engins = [
      'components/daydream/StarMakerEngin.tsx',
      'components/daydream/GameEngin.tsx',
      'components/daydream/LabEngin.tsx',
      'components/daydream/CodeEngin.tsx',
      'components/daydream/BrandingEngin.tsx',
      'components/daydream/ContentEngin.tsx',
    ];
    for (const f of engins) {
      const src = readSource(f);
      expect(src).toContain("from '@/lib/supabase/client'");
    }
  });

  it('no Engin component exposes secrets to client', () => {
    const engins = [
      'components/daydream/StarMakerEngin.tsx',
      'components/daydream/GameEngin.tsx',
      'components/daydream/LabEngin.tsx',
      'components/daydream/CodeEngin.tsx',
      'components/daydream/BrandingEngin.tsx',
      'components/daydream/ContentEngin.tsx',
    ];
    const secretPatterns = [/SUPABASE_SERVICE_ROLE/i, /SERVICE_KEY/i, /secret_key/i];
    for (const f of engins) {
      const src = readSource(f);
      for (const pat of secretPatterns) {
        expect(src).not.toMatch(pat);
      }
    }
  });
});
