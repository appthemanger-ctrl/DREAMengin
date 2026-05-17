'use client';

/**
 * lib/gameengin/cartridges/loaders.ts
 *
 * Client-side loader registry — one async loader per cartridge in the
 * repository. Keep in sync with `./manifest.ts`.
 */

import type { GameCartridge } from '../cartridge';
import { defineReactCartridgeLoader } from './reactCartridge';

export type CartridgeLoader = () => Promise<GameCartridge>;

const load = defineReactCartridgeLoader;

export const CARTRIDGE_LOADERS: Readonly<Record<string, CartridgeLoader>> = {
  // ── Legacy flagships kept ─────────────────────────────────────────────────
  'platformer':            load('platformer',            () => import('@/components/games/dream.BabylonSideScroller')),
  'neon-drift':            load('neon-drift',            () => import('@/components/games/dream.NeonDrift')),
  'echo-arena':            load('echo-arena',            () => import('@/components/games/dream.EchoArena')),

  // ── Fusion flagships ──────────────────────────────────────────────────────
  'null-cathedral':        load('null-cathedral',        () => import('@/components/games/dream.NullCathedral')),
  'voidline-gp':           load('voidline-gp',           () => import('@/components/games/dream.VoidlineGP')),
  'serpent-siege':         load('serpent-siege',         () => import('@/components/games/dream.SerpentSiege')),
  'avenue-of-mirrors':     load('avenue-of-mirrors',     () => import('@/components/games/dream.AvenueOfMirrors')),
  'engin-fracture':        load('engin-fracture',        () => import('@/components/games/dream.EnginFracture')),

  // ── Advanced fusions ──────────────────────────────────────────────────────
  'glassfall':             load('glassfall',             () => import('@/components/games/dream.Glassfall')),
  'nite-flyer-solar-hymn': load('nite-flyer-solar-hymn', () => import('@/components/games/dream.NiteFlyerSolarHymn')),
  'lexicon-solitaire':     load('lexicon-solitaire',     () => import('@/components/games/dream.LexiconSolitaire')),

  // ── Classic fusion ────────────────────────────────────────────────────────
  'defuse-ritual':         load('defuse-ritual',         () => import('@/components/games/dream.DefuseRitual')),
};

export async function loadCartridge(id: string: Promise<GameCartridge> {
  const loader = CARTRIDGE_LOADERS[id];
  if (!loader) {
    throw new Error(`Cartridge failed to load: ${id}. No loader is registered for this cartridge id.`);
  }
  try {
    return await loader();
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Cartridge failed to load: ${id}. ${details}`);
  }
}

export function getCartridgeIds(: string[] {
  return Object.keys(CARTRIDGE_LOADERS);
}
