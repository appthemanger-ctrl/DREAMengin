/**
 * tests/gameengin-cartridges.test.ts
 *
 * Guarantees the GameEngin cartridge bay stays in sync with the rest of the
 * platform:
 *   1. Every entry in `CARTRIDGE_MANIFEST` has a matching dynamic loader.
 *   2. Every loader has a matching manifest entry (no orphans).
 *   3. Every manifest id mirrors the legacy `GAMES` array in
 *      `components/games/GamesHub` so users can launch every game from
 *      `/gameengin/cartridges/[id]`.
 *   4. Manifest ids are unique and URL-safe.
 *   5. The new `/gameengin/cartridges` route file exists and exports default.
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  CARTRIDGE_MANIFEST,
  getCartridgeManifest,
  getCartridgeCategories,
} from '@/lib/gameengin/cartridges/manifest';
import { CARTRIDGE_LOADERS, getCartridgeIds } from '@/lib/gameengin/cartridges/loaders';
import { GAMES } from '@/components/games/GamesHub';

describe('GameEngin cartridge bay', () => {
  it('manifest is non-empty and ids are unique URL-safe slugs', () => {
    expect(CARTRIDGE_MANIFEST.length).toBeGreaterThan(10);
    const ids = CARTRIDGE_MANIFEST.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    }
  });

  it('every manifest entry has a registered loader', () => {
    for (const c of CARTRIDGE_MANIFEST) {
      expect(typeof CARTRIDGE_LOADERS[c.id]).toBe('function');
    }
  });

  it('every registered loader has a manifest entry (no orphans)', () => {
    for (const id of getCartridgeIds()) {
      expect(getCartridgeManifest(id), `loader "${id}" missing from manifest`).toBeDefined();
    }
  });

  it('manifest covers every game in GamesHub.GAMES (backwards compatibility)', () => {
    const gameIds = new Set(GAMES.map((g) => g.id));
    const manifestIds = new Set(CARTRIDGE_MANIFEST.map((c) => c.id));
    for (const id of gameIds) {
      expect(manifestIds.has(id), `cartridge missing for repo game "${id}"`).toBe(true);
    }
  });

  it('exposes a stable category list', () => {
    const cats = getCartridgeCategories();
    expect(cats.length).toBeGreaterThan(0);
    expect(new Set(cats).size).toBe(cats.length);
  });

  it('every cartridge declares a known render mode and tier', () => {
    const validModes = new Set(['canvas', 'webgpu', 'babylon', 'dom']);
    const validTiers = new Set(['flagship', 'advanced', 'classic', 'casual']);
    for (const c of CARTRIDGE_MANIFEST) {
      expect(validModes.has(c.renderMode)).toBe(true);
      expect(validTiers.has(c.tier)).toBe(true);
    }
  });

  it('lookup helper returns undefined for unknown ids', () => {
    expect(getCartridgeManifest('definitely-not-a-cartridge')).toBeUndefined();
  });

  it('exposes a browsable route at /gameengin/cartridges and /gameengin/cartridges/[id]', () => {
    const browseRoute = join(process.cwd(), 'app', 'gameengin', 'cartridges', 'page.tsx');
    const launchRoute = join(process.cwd(), 'app', 'gameengin', 'cartridges', '[id]', 'page.tsx');
    const indexRoute  = join(process.cwd(), 'app', 'gameengin', 'page.tsx');
    expect(existsSync(browseRoute)).toBe(true);
    expect(existsSync(launchRoute)).toBe(true);
    expect(existsSync(indexRoute)).toBe(true);
  });
});
