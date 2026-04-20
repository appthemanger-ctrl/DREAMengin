'use client';

/**
 * lib/gameengin/cartridges/loaders.ts
 *
 * Client-side loader registry — one async loader per cartridge in the
 * repository. Keep in sync with `./manifest.ts`.
 */

import type { GameCartridge } from '../cartridge';
import { wrapAsCartridge } from '../ReactComponentCartridge';

export type CartridgeLoader = () => Promise<GameCartridge>;

const load = (id: string, importer: () => Promise<{ default: React.ComponentType }>): CartridgeLoader =>
  async () => wrapAsCartridge(id, (await importer()).default);

export const CARTRIDGE_LOADERS: Readonly<Record<string, CartridgeLoader>> = {
  // ── Legacy flagships kept ─────────────────────────────────────────────────
  'platformer':            load('platformer',            () => import('@/components/games/BabylonSideScroller')),
  'neon-drift':            load('neon-drift',            () => import('@/components/games/NeonDrift')),
  'echo-arena':            load('echo-arena',            () => import('@/components/games/EchoArena')),

  // ── Fusion flagships ──────────────────────────────────────────────────────
  'null-cathedral':        load('null-cathedral',        () => import('@/components/games/NullCathedral')),
  'voidline-gp':           load('voidline-gp',           () => import('@/components/games/VoidlineGP')),
  'serpent-siege':         load('serpent-siege',         () => import('@/components/games/SerpentSiege')),
  'avenue-of-mirrors':     load('avenue-of-mirrors',     () => import('@/components/games/AvenueOfMirrors')),
  'engin-fracture':        load('engin-fracture',        () => import('@/components/games/EnginFracture')),

  // ── Advanced fusions ──────────────────────────────────────────────────────
  'glassfall':             load('glassfall',             () => import('@/components/games/Glassfall')),
  'nite-flyer-solar-hymn': load('nite-flyer-solar-hymn', () => import('@/components/games/NiteFlyerSolarHymn')),
  'lexicon-solitaire':     load('lexicon-solitaire',     () => import('@/components/games/LexiconSolitaire')),

  // ── Classic fusion ────────────────────────────────────────────────────────
  'defuse-ritual':         load('defuse-ritual',         () => import('@/components/games/DefuseRitual')),
};

export async function loadCartridge(id: string): Promise<GameCartridge | null> {
  const loader = CARTRIDGE_LOADERS[id];
  if (!loader) return null;
  return loader();
}

export function getCartridgeIds(): string[] {
  return Object.keys(CARTRIDGE_LOADERS);
}
