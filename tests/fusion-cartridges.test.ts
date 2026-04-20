/**
 * Sanity coverage for the 9 fusion cartridges that replaced 25 source games.
 * Asserts each cartridge file exists, default-exports a React component, and
 * contains its title-card lore string + game-engin score wiring.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CARTRIDGE_MANIFEST } from '@/lib/gameengin/cartridges/manifest';
import { CARTRIDGE_LOADERS } from '@/lib/gameengin/cartridges/loaders';

const REPO_ROOT = process.cwd();

const FUSION = [
  { id: 'null-cathedral',        file: 'NullCathedral.tsx',       title: 'NULL CATHEDRAL',     loreToken: 'CASTLE' },
  { id: 'voidline-gp',           file: 'VoidlineGP.tsx',          title: 'VOIDLINE GP',        loreToken: 'Yuna' },
  { id: 'serpent-siege',         file: 'SerpentSiege.tsx',        title: 'SERPENT SIEGE',      loreToken: 'Mother Egg' },
  { id: 'avenue-of-mirrors',     file: 'AvenueOfMirrors.tsx',     title: 'AVENUE OF MIRRORS',  loreToken: 'glyph' },
  { id: 'engin-fracture',        file: 'EnginFracture.tsx',       title: 'ENGIN: FRACTURE',    loreToken: 'Vesh' },
  { id: 'glassfall',             file: 'Glassfall.tsx',           title: 'GLASSFALL',          loreToken: 'Architect' },
  { id: 'nite-flyer-solar-hymn', file: 'NiteFlyerSolarHymn.tsx',  title: 'NITE FLYER',         loreToken: 'Long Pause' },
  { id: 'lexicon-solitaire',     file: 'LexiconSolitaire.tsx',    title: 'LEXICON SOLITAIRE',  loreToken: 'Lin Argo' },
  { id: 'defuse-ritual',         file: 'DefuseRitual.tsx',        title: 'DEFUSE RITUAL',      loreToken: 'Candle' },
];

describe('fusion cartridges — file presence + content', () => {
  for (const c of FUSION) {
    it(`${c.id} ships a real component file with lore + score wiring`, () => {
      const path = join(REPO_ROOT, 'components/games', c.file);
      expect(existsSync(path), `expected ${path} to exist`).toBe(true);
      const src = readFileSync(path, 'utf8');
      expect(src).toContain("'use client'");
      expect(src).toContain('export default function');
      expect(src).toContain(c.title);
      expect(src).toContain(c.loreToken);
      expect(src).toContain(`useSubmitScore('${c.id}')`);
    });
  }
});

describe('fusion cartridges — manifest + loader registration', () => {
  for (const c of FUSION) {
    it(`${c.id} is registered in manifest and loader registry`, () => {
      expect(CARTRIDGE_MANIFEST.some((m) => m.id === c.id)).toBe(true);
      expect(typeof CARTRIDGE_LOADERS[c.id]).toBe('function');
    });
  }
});

describe('fusion cartridges — deleted source games are gone', () => {
  const deleted = [
    'ENGINBattle.tsx', 'DREAMquest.tsx', 'DREAMwars.tsx', 'RTSGame.tsx',
    'TowerDefense.tsx', 'RPGGame.tsx', 'LucidAvenue.tsx', 'SpaceShooter.tsx',
    'SnakeGame.tsx', 'BreakoutGame.tsx', 'TetrisGame.tsx', 'Match3Game.tsx',
    'RacingGame.tsx', 'ChessGame.tsx', 'RhythmGame.tsx', 'MazeGame.tsx',
    'PongGame.tsx', 'MinesweeperGame.tsx', 'SolitaireGame.tsx', 'FlappyGame.tsx',
    'MemoryGrid.tsx', 'WordSprint.tsx', 'SpeedTap.tsx', 'TriviaGame.tsx',
    'AvatarMaker.tsx',
  ];
  for (const f of deleted) {
    it(`removes components/games/${f}`, () => {
      expect(existsSync(join(REPO_ROOT, 'components/games', f))).toBe(false);
    });
  }
});
