/**
 * tests/gameengin-architect.test.ts
 *
 * Locks the new pieces from the Game Architect + Cartridge Status directive:
 *   - Concept Patterns library (settings / protagonists / scope-formulas)
 *   - Vision Statement schema + recordVisionStatement validation
 *   - Cartridge Status System (active / improving / stable) on MANIFEST.json
 *   - Maestro skips `stable` cartridges
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  BRAIN_ROOT,
  listConceptPatterns,
  listVisionStatements,
  readVisionStatement,
  recordVisionStatement,
  readCartridgeStatus,
  setCartridgeStatus,
  listCartridgesByStatus,
  listCartridges,
  VISION_STATEMENT_MAX_BYTES,
  VISION_BUDGET_MAX_HOURS,
  type VisionStatement,
} from '@/lib/gameengin/brain-reader';

const CONCEPT_LIB = path.join(BRAIN_ROOT, 'concept-library');

function makeValidVision(overrides: Partial<VisionStatement> =) {}): VisionStatement {
  return {
    vision_id: 'test-architect-vision',
    title: 'Test Architect Vision',
    elevator_pitch: 'A test pitch.',
    setting: { world: 'A test world.', vibe: 'testy', visual_tone: 'monochrome' },
    protagonist: { role: 'A tester.', motivation: 'Find bugs.' },
    genre: 'platformer',
    core_mechanics: ['dash', 'coyote-time'],
    scope: { mode: 'single-player', estimated_player_minutes: 20, studio_build_budget_hours: 4 },
    status: 'drafted',
    drafted_at: new Date().toISOString(),
    ...overrides,
  };
}

function cleanupTestVisions() {
  for (const f of fs.readdirSync(CONCEPT_LIB)) {
    if (f.startsWith('test-architect-') && f.endsWith('.json')) {
      fs.unlinkSync(path.join(CONCEPT_LIB, f));
    }
  }
}

describe('Concept Patterns library', () => {
  it('exposes setting / protagonist / scope-formula categories', () => {
    const settings = listConceptPatterns('setting');
    const protagonists = listConceptPatterns('protagonist');
    const scopes = listConceptPatterns('scope-formula');
    expect(settings.length).toBeGreaterThan(0);
    expect(protagonists.length).toBeGreaterThan(0);
    expect(scopes.length).toBeGreaterThan(0);
    expect(settings.every((p) => p.category === 'setting')).toBe(true);
  });

  it('listConceptPatterns() returns every pattern when no category filter is passed', () => {
    const all = listConceptPatterns();
    const sum = listConceptPatterns('setting').length
      + listConceptPatterns('protagonist').length
      + listConceptPatterns('scope-formula').length;
    expect(all.length).toBe(sum);
  });
});

describe('Vision Statement storage', () => {
  afterEach(cleanupTestVisions);

  it('round-trips a valid vision statement', () => {
    const v = makeValidVision();
    const file = recordVisionStatement(v);
    expect(fs.existsSync(file)).toBe(true);
    const round = readVisionStatement(v.vision_id);
    expect(round?.vision_id).toBe(v.vision_id);
    expect(round?.core_mechanics).toEqual(v.core_mechanics);
  });

  it('appears in listVisionStatements()', () => {
    recordVisionStatement(makeValidVision());
    const all = listVisionStatements();
    expect(all.find((x) => x.vision_id === 'test-architect-vision')).toBeDefined();
  });

  it('rejects invalid vision_id', () => {
    expect(() => recordVisionStatement(makeValidVision({ vision_id: 'Not A Slug!' }))).toThrow(/vision_id/);
  });

  it('rejects core_mechanics outside the 2–4 range', () => {
    expect(() => recordVisionStatement(makeValidVision({ vision_id: 'test-architect-bad-mech', core_mechanics: ['only-one'] }))).toThrow(/core_mechanics/);
    expect(() => recordVisionStatement(makeValidVision({
      vision_id: 'test-architect-too-many',
      core_mechanics: ['a', 'b', 'c', 'd', 'e'],
    }))).toThrow(/core_mechanics/);
  });

  it('caps studio_build_budget_hours at one studio-day (24h)', () => {
    expect(VISION_BUDGET_MAX_HOURS).toBe(24);
    expect(() => recordVisionStatement(makeValidVision({
      vision_id: 'test-architect-too-long',
      scope: { mode: 'single-player', estimated_player_minutes: 30, studio_build_budget_hours: 48 },
    }))).toThrow(/studio_build_budget_hours/);
  });

  it('caps payload at 8 KB', () => {
    expect(VISION_STATEMENT_MAX_BYTES).toBe(8 * 1024);
    expect(() => recordVisionStatement(makeValidVision({
      vision_id: 'test-architect-huge',
      notes: 'x'.repeat(VISION_STATEMENT_MAX_BYTES),
    }))).toThrow(/exceeds/);
  });

  it('readVisionStatement returns null for unknown / invalid ids', () => {
    expect(readVisionStatement('nope-not-here')).toBeNull();
    expect(readVisionStatement('Bad Slug!')).toBeNull();
  });

  it('ships a seeded "neon-courier" vision in the Concept Library', () => {
    const seed = readVisionStatement('neon-courier');
    expect(seed).not.toBeNull();
    expect(seed?.genre).toBe('platformer');
    expect(seed?.core_mechanics.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Cartridge Status System', () => {
  let originalManifest: string;
  const manifestPath = path.join(process.cwd(), 'public', 'cartridges', 'mad-maxi', 'MANIFEST.json');

  beforeEach(() => { originalManifest = fs.readFileSync(manifestPath, 'utf-8'); });
  afterEach(() => { fs.writeFileSync(manifestPath, originalManifest); });

  it('reads the declared status from MANIFEST.json', () => {
    expect(readCartridgeStatus('mad-maxi')).toBe('active');
  });

  it('defaults to "improving" when no status is declared', () => {
    const m = JSON.parse(originalManifest);
    delete m.status;
    fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2));
    expect(readCartridgeStatus('mad-maxi')).toBe('improving');
  });

  it('writes a new status back to MANIFEST.json', () => {
    setCartridgeStatus('mad-maxi', 'stable');
    expect(readCartridgeStatus('mad-maxi')).toBe('stable');
    const persisted = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(persisted.status).toBe('stable');
  });

  it('rejects unknown statuses', () => {
    expect(() => setCartridgeStatus('mad-maxi', 'shipped' as never)).toThrow(/invalid status/);
  });

  it('listCartridgesByStatus partitions the library', () => {
    const cartridges = listCartridges();
    expect(cartridges).toContain('mad-maxi');
    const active = listCartridgesByStatus('active');
    expect(active).toContain('mad-maxi');

    setCartridgeStatus('mad-maxi', 'stable');
    expect(listCartridgesByStatus('active')).not.toContain('mad-maxi');
    expect(listCartridgesByStatus('stable')).toContain('mad-maxi');
  });
});
