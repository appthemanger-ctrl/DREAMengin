/**
 * tests/gameengin-progression.test.ts
 *
 * Locks the Modern Game Structures directive:
 *   - every Genre Profile carries a `progression_model` block
 *   - the four new structure-type genres (open-world / live-service /
 *     sandbox / episodic) are present and well-formed
 *   - the Mechanic Catalog includes the new `structural` category and
 *     surfaces it via listStructuralMechanics()
 *   - per-cartridge progression-state ledger round-trips and validates
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  BRAIN_ROOT,
  listGenres,
  readGenreDNA,
  readProgressionModel,
  listStructuralMechanics,
  recordProgressionState,
  readProgressionState,
  STRUCTURE_TYPES,
  type StructureType,
} from '@/lib/gameengin/brain-reader';

const PROGRESSION_DIR = path.join(BRAIN_ROOT, 'progression-state');

function cleanup(slug: string) {
  const f = path.join(PROGRESSION_DIR, `${slug}.json`);
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

describe('Genre Profiles — Modern Game Structures', () => {
  it('every genre (excluding template) declares a progression_model', () => {
    const genres = listGenres();
    expect(genres.length).toBeGreaterThanOrEqual(7);
    expect(genres).not.toContain('template');
    for (const g of genres) {
      const dna = readGenreDNA(g);
      expect(dna.progression_model, `genre "${g}" missing progression_model`).toBeDefined();
      const pm = dna.progression_model!;
      expect(STRUCTURE_TYPES, `genre "${g}" structure_type unknown`).toContain(pm.structure_type);
      expect(pm.completion_definition).toBeTruthy();
      expect(pm.content_cadence).toBeTruthy();
      expect(Array.isArray(pm.progression_gates)).toBe(true);
    }
  });

  it('ships profiles for every structure-type the directive enumerates', () => {
    const required: StructureType[] = [
      'linear', 'open-world', 'run-based', 'metroidvania',
      'live-service', 'sandbox', 'episodic',
    ];
    const seen = new Set(listGenres().map((g) => readProgressionModel(g)?.structure_type).filter(Boolean));
    for (const t of required) {
      expect(seen, `no genre uses structure_type "${t}"`).toContain(t);
    }
  });

  it('readProgressionModel returns the same data as readGenreDNA().progression_model', () => {
    expect(readProgressionModel('platformer')).toEqual(readGenreDNA('platformer').progression_model);
  });
});

describe('Structural Mechanics catalog', () => {
  it('lists the seeded structural mechanics', () => {
    const mechs = listStructuralMechanics();
    const names = mechs.map((m) => m.name);
    expect(names).toEqual(expect.arrayContaining([
      'Ability Gating',
      'Meta Progression',
      'Procedural Generation',
      'Run Persistence',
      'Season Pass',
      'World Streaming',
    ]));
    for (const m of mechs) {
      expect(m.category).toBe('structural');
      expect(m.structural_role).toBeTruthy();
      expect(Array.isArray(m.applies_to_structures)).toBe(true);
      for (const s of m.applies_to_structures) {
        expect(STRUCTURE_TYPES).toContain(s);
      }
    }
  });
});

describe('Progression State ledger', () => {
  afterEach(() => cleanup('test-progression-cartridge'));

  it('round-trips an open-world entry with clamped completion percentage', () => {
    const file = recordProgressionState({
      cartridge_id: 'test-progression-cartridge',
      structure_type: 'open-world',
      world_map_completion_pct: 1.42, // out of range — should clamp
      ability_unlocks: ['dash', '  glide  ', ''],
    });
    expect(fs.existsSync(file)).toBe(true);
    const back = readProgressionState('test-progression-cartridge');
    expect(back?.structure_type).toBe('open-world');
    expect(back?.world_map_completion_pct).toBe(1);
    expect(back?.ability_unlocks).toEqual(['dash', 'glide']);
    expect(back?.last_updated_at).toBeTruthy();
  });

  it('round-trips a run-based entry with meta_currency and run_count', () => {
    recordProgressionState({
      cartridge_id: 'test-progression-cartridge',
      structure_type: 'run-based',
      run_count: 17.9,            // floors to 17
      meta_currency: { shard: 120, prism: 4 },
    });
    const back = readProgressionState('test-progression-cartridge');
    expect(back?.run_count).toBe(17);
    expect(back?.meta_currency).toEqual({ shard: 120, prism: 4 });
  });

  it('round-trips a live-service entry with season_phase and active_events', () => {
    recordProgressionState({
      cartridge_id: 'test-progression-cartridge',
      structure_type: 'live-service',
      season_phase: 'season-3-mid',
      active_events: ['neon-storm'],
    });
    const back = readProgressionState('test-progression-cartridge');
    expect(back?.season_phase).toBe('season-3-mid');
    expect(back?.active_events).toEqual(['neon-storm']);
  });

  it('rejects invalid cartridge_id, structure_type, run_count, and meta_currency', () => {
    expect(() => recordProgressionState({
      cartridge_id: 'Bad Slug!',
      structure_type: 'linear',
    })).toThrow(/cartridge_id/);

    expect(() => recordProgressionState({
      cartridge_id: 'test-progression-cartridge',
      structure_type: 'mmo' as never,
    })).toThrow(/structure_type/);

    expect(() => recordProgressionState({
      cartridge_id: 'test-progression-cartridge',
      structure_type: 'run-based',
      run_count: -1,
    })).toThrow(/run_count/);

    expect(() => recordProgressionState({
      cartridge_id: 'test-progression-cartridge',
      structure_type: 'run-based',
      meta_currency: { soft: -5 },
    })).toThrow(/meta_currency/);
  });

  it('returns null for unknown / invalid ids', () => {
    expect(readProgressionState('nope-not-here')).toBeNull();
    expect(readProgressionState('Bad Slug!')).toBeNull();
  });
});
