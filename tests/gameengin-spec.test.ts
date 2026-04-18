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
});
