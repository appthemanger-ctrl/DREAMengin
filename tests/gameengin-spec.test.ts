/**
 * tests/gameengin-spec.test.ts
 *
 * Validates the foundational deliverables of GameENGINspec.md:
 *   §1.3 cartridge MANIFEST.json schema
 *   §2   Brain substrate integrity
 *   §4.4 Originality registry uniqueness + scoring
 *   §5.5 Cartridge packager round-trip + magic-byte validator
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  CARTRIDGE_MAGIC,
  hasCartridgeMagic,
  validateManifest,
} from '@/lib/gameengin/cartridge-manifest';
import { parseDreamrArchive } from '@/lib/gameengin/cartridgeLoader';
import {
  BRAIN_ROOT,
  listMechanics,
  readGenreDNA,
  readOriginalityRegistry,
  signatureHash,
  isOriginal,
} from '@/lib/gameengin/brain-reader';
import { packTar, unpackTar } from '@/scripts/gameengin/lib/tar';

describe('GameEngin spec — Brain substrate (§2)', () => {
  it('seeds at least 6 principles', () => {
    const dir = path.join(BRAIN_ROOT, 'principles');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    expect(files.length).toBeGreaterThanOrEqual(6);
  });

  it('seeds the canonical genre-dna files', () => {
    const expected = ['platformer', 'metroidvania', 'action-rpg', 'roguelike', 'puzzle', 'racing'];
    for (const g of expected) {
      const dna = readGenreDNA(g);
      expect(dna.genre).toBeTruthy();
      expect(dna.pacing_profile).toBeTruthy();
      expect(Array.isArray(dna.anti_patterns)).toBe(true);
    }
  });

  it('seeds at least 12 mechanics across categories', () => {
    const all = listMechanics();
    expect(all.length).toBeGreaterThanOrEqual(12);
    const categories = new Set(all.map((m) => m.category));
    expect(categories.has('movement')).toBe(true);
    expect(categories.has('combat')).toBe(true);
    expect(categories.has('progression')).toBe(true);
    expect(categories.has('camera')).toBe(true);
  });
});

describe('GameEngin spec — Originality registry (§4.4)', () => {
  it('signatureHash is deterministic and order-independent over mechanic ids', () => {
    const a = signatureHash('platformer', ['dash', 'double-jump', 'parry']);
    const b = signatureHash('platformer', ['parry', 'dash', 'double-jump']);
    expect(a).toBe(b);
  });

  it('signatures.json has unique hashes', () => {
    const reg = readOriginalityRegistry();
    const hashes = reg.signatures.map((s) => s.hash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it('isOriginal returns true for an unseen combination', () => {
    expect(isOriginal('sha256:never-seen-genre+x+y:0000000000000000')).toBe(true);
  });
});

describe('GameEngin spec — Cartridge MANIFEST (§1.3)', () => {
  it('Mad Maxi MANIFEST.json validates against the schema', () => {
    const raw = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public/cartridges/mad-maxi/MANIFEST.json'), 'utf-8'),
    );
    const m = validateManifest(raw);
    expect(m.cartridge_id).toBe('mad-maxi');
    expect(m.dreamr_version).toBe(1);
    expect(m.entry).toMatch(/\.wasm$/);
  });

  it('rejects malformed manifests', () => {
    expect(() => validateManifest({ cartridge_id: 'X', dreamr_version: 2 })).toThrow();
  });
});

describe('GameEngin spec — TAR + magic bytes (§1.1, §5.5)', () => {
  it('round-trips a single file through ustar', () => {
    const data = new TextEncoder().encode('hello dreamengin');
    const tar = packTar([{ name: 'greeting.txt', data }]);
    const back = unpackTar(tar);
    expect(back).toHaveLength(1);
    expect(back[0].name).toBe('greeting.txt');
    expect(new TextDecoder().decode(back[0].data)).toBe('hello dreamengin');
  });

  it('round-trips multiple files', () => {
    const files = [
      { name: 'MANIFEST.json', data: new TextEncoder().encode('{"x":1}') },
      { name: 'logic/main.wasm', data: new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]) },
    ];
    const back = unpackTar(packTar(files));
    expect(back.map((f) => f.name)).toEqual(files.map((f) => f.name));
    expect(back[1].data).toEqual(files[1].data);
  });

  it('hasCartridgeMagic recognises DRMR header', () => {
    const buf = new Uint8Array([...CARTRIDGE_MAGIC, 0x00, 0x01]);
    expect(hasCartridgeMagic(buf)).toBe(true);
    expect(hasCartridgeMagic(new Uint8Array([0, 0, 0, 0]))).toBe(false);
  });

  it('parses a DRMR-prefixed cartridge through the canonical loader', () => {
    const manifest = {
      dreamr_version: 1,
      cartridge_id: 'unit-test-cart',
      title: 'Unit Test Cart',
      author: 'DREAMengin',
      version: '1.0.0',
      entry: 'logic/main.wasm',
      render_mode: 'webgpu',
      permissions: ['gamepad'],
      min_quality_tier: 'low',
      target_frame_rate: 60,
      memory_budget_mb: 64,
      save_schema_version: 1,
      dependencies: { gameengin_runtime: '^1.0.0' },
      metadata: {
        genre: ['test'],
        estimated_playtime_minutes: 1,
        player_count: [1],
        tags: ['unit'],
      },
    };
    const tar = packTar([
      {
        name: 'MANIFEST.json',
        data: new TextEncoder().encode(JSON.stringify(manifest)),
      },
      { name: 'logic/main.wasm', data: new Uint8Array([0, 97, 115, 109]) },
    ]);
    const archive = parseDreamrArchive(new Uint8Array([...CARTRIDGE_MAGIC, ...tar]));
    expect(archive.manifest.cartridge_id).toBe('unit-test-cart');
    expect(archive.getFile('logic/main.wasm')).toEqual(new Uint8Array([0, 97, 115, 109]));
  });
});

// ---------------------------------------------------------------------------
// v2 — Expanded agent profiles
// ---------------------------------------------------------------------------

import {
  listCartridges,
  listTechniques,
  listMaterialRecipes,
  listCompositionPrinciples,
  readCharacterVoice,
  readEmotionalTone,
  listEmotionalTones,
  listDialoguePatterns,
  readNarrativePacing,
  readUpgradeRules,
  recordBuild,
  recordAssetGeneration,
  recordAssignments,
  recordUpgrade,
  getLastTouched,
} from '@/lib/gameengin/brain-reader';

describe('GameEngin spec v2 — Artisan brain layers', () => {
  it('seeds at least one technique per category (modeling/lighting/optimization)', () => {
    const techs = listTechniques();
    const cats = new Set(techs.map((t) => t.category));
    expect(cats.has('modeling')).toBe(true);
    expect(cats.has('lighting')).toBe(true);
    expect(cats.has('optimization')).toBe(true);
  });

  it('seeds at least 3 material recipes', () => {
    expect(listMaterialRecipes().length).toBeGreaterThanOrEqual(3);
  });

  it('seeds at least 2 composition principles', () => {
    expect(listCompositionPrinciples().length).toBeGreaterThanOrEqual(2);
  });
});

describe('GameEngin spec v2 — Writer brain layers', () => {
  it('reads the Mad Maxi character voice', () => {
    const voice = readCharacterVoice('mad-maxi');
    expect(voice).not.toBeNull();
    expect(voice!.character).toBe('Mad Maxi');
    expect(voice!.vocabulary.preferred.length).toBeGreaterThan(0);
  });

  it('seeds the 5 canonical emotional tones', () => {
    const tones = listEmotionalTones();
    const names = tones.map((t) => t.tone);
    for (const t of ['hopeful', 'weary', 'determined', 'reflective', 'fierce']) {
      expect(names).toContain(t);
    }
    expect(readEmotionalTone('hopeful')).not.toBeNull();
  });

  it('seeds at least 3 dialogue patterns', () => {
    expect(listDialoguePatterns().length).toBeGreaterThanOrEqual(3);
  });

  it('exposes a default narrative pacing curve', () => {
    const p = readNarrativePacing();
    expect(p.tone_rotation.length).toBeGreaterThanOrEqual(5);
    expect(p.beat_interval_levels).toBeGreaterThan(0);
  });
});

describe('GameEngin spec v2 — Maestro / Mechanic / Upgrader operational memory', () => {
  it('listCartridges discovers Mad Maxi via MANIFEST.json', () => {
    const ids = listCartridges();
    expect(ids).toContain('mad-maxi');
  });

  it('upgrade prioritization rules are well-formed', () => {
    const rules = readUpgradeRules();
    expect(rules.weights.days_since_last_touch).toBeGreaterThan(0);
    expect(rules.tier_multipliers.flagship).toBeGreaterThan(rules.tier_multipliers.archived);
    expect(rules.min_dispatch_score).toBeGreaterThan(0);
  });

  it('recordBuild / recordAssetGeneration / recordAssignments / recordUpgrade write valid JSON files', () => {
    const buildPath = recordBuild({
      cartridge_id: '__test__',
      source: 'assembly/__test__-player.ts',
      bytes: 1234,
      success: true,
      mechanics_referenced: ['coyote-time'],
      optimisation_flags: ['--shrinkLevel', '2'],
    });
    expect(fs.existsSync(buildPath)).toBe(true);
    const buildEntry = JSON.parse(fs.readFileSync(buildPath, 'utf-8'));
    expect(buildEntry.cartridge_id).toBe('__test__');
    expect(buildEntry.built_at).toMatch(/^\d{4}-/);

    const assetPath = recordAssetGeneration({
      cartridge_id: '__test__',
      asset: 'cover_art',
      prompt_manifest_hash: 'deadbeef',
      techniques_applied: ['technique:Edge Flow for Deformable Meshes'],
      submitted_to: 'none',
      output_url: null,
    });
    expect(fs.existsSync(assetPath)).toBe(true);

    const wqPath = recordAssignments(
      [{ cartridge_id: '__test__', agent: 'prophet', reason: 'unit-test', last_touched_at: null, dispatched: false }],
      ['__test__'],
    );
    expect(fs.existsSync(wqPath)).toBe(true);

    const upPath = recordUpgrade({
      cartridge_id: '__test__',
      upgrade_targets: ['mechanics'],
      priority_scores: { mechanics: 0.9 },
      dispatched_agents: ['mechanic'],
      backward_compatibility_checks: ['manifest_present:true'],
    });
    expect(fs.existsSync(upPath)).toBe(true);

    // Cleanup test artefacts to keep the brain tidy across runs.
    fs.rmSync(buildPath, { force: true });
    fs.rmSync(assetPath, { force: true });
    fs.rmSync(wqPath, { force: true });
    fs.rmSync(path.dirname(upPath), { recursive: true, force: true });
  });

  it('getLastTouched returns null for an agent that has not touched a cartridge', () => {
    expect(getLastTouched('__never-existed__', 'prophet')).toBeNull();
  });
});
