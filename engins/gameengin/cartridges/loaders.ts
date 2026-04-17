'use client';

/**
 * engins/gameengin/cartridges/loaders.ts
 *
 * Client-side loader registry — one async loader per game in the repository.
 * Each loader dynamically imports the underlying React component and wraps it
 * as a `GameCartridge` via `wrapAsCartridge`, so every legacy game runs through
 * the same `GameRuntime` host without modification.
 *
 * Keep this in sync with `./manifest.ts`. The synchronisation is enforced by
 * `tests/gameengin-cartridges.test.ts`.
 */

import type { GameCartridge } from '../cartridge';
import { wrapAsCartridge } from '../ReactComponentCartridge';

export type CartridgeLoader = () => Promise<GameCartridge>;

const load = (id: string, importer: () => Promise<{ default: React.ComponentType }>): CartridgeLoader =>
  async () => wrapAsCartridge(id, (await importer()).default);

/**
 * Registry of dynamic-import loaders keyed by cartridge id. Imports are lazy:
 * a cartridge's bundle is only fetched the first time its loader is awaited.
 */
export const CARTRIDGE_LOADERS: Readonly<Record<string, CartridgeLoader>> = {
  // ── Flagship ──────────────────────────────────────────────────────────────
  'platformer':    load('platformer',    () => import('@/components/games/BabylonSideScroller')),
  'neon-drift':    load('neon-drift',    () => import('@/components/games/NeonDrift')),
  'echo-arena':    load('echo-arena',    () => import('@/components/games/EchoArena')),

  // ── Advanced ──────────────────────────────────────────────────────────────
  'engin-battle':  load('engin-battle',  () => import('@/components/games/ENGINBattle')),
  'dreamquest':    load('dreamquest',    () => import('@/components/games/DREAMquest')),
  'dreamwars':     load('dreamwars',     () => import('@/components/games/DREAMwars')),
  'rts':           load('rts',           () => import('@/components/games/RTSGame')),
  'tower-defense': load('tower-defense', () => import('@/components/games/TowerDefense')),
  'rpg':           load('rpg',           () => import('@/components/games/RPGGame')),
  'lucid-avenue':  load('lucid-avenue',  () => import('@/components/games/LucidAvenue')),

  // ── Classic ───────────────────────────────────────────────────────────────
  'space-shooter': load('space-shooter', () => import('@/components/games/SpaceShooter')),
  'snake':         load('snake',         () => import('@/components/games/SnakeGame')),
  'breakout':      load('breakout',      () => import('@/components/games/BreakoutGame')),
  'tetris':        load('tetris',        () => import('@/components/games/TetrisGame')),
  'match3':        load('match3',        () => import('@/components/games/Match3Game')),
  'racing':        load('racing',        () => import('@/components/games/RacingGame')),
  'chess':         load('chess',         () => import('@/components/games/ChessGame')),
  'rhythm':        load('rhythm',        () => import('@/components/games/RhythmGame')),
  'maze':          load('maze',          () => import('@/components/games/MazeGame')),
  'pong':          load('pong',          () => import('@/components/games/PongGame')),
  'minesweeper':   load('minesweeper',   () => import('@/components/games/MinesweeperGame')),
  'solitaire':     load('solitaire',     () => import('@/components/games/SolitaireGame')),

  // ── Casual ────────────────────────────────────────────────────────────────
  'flappy':        load('flappy',        () => import('@/components/games/FlappyGame')),
  'memory-grid':   load('memory-grid',   () => import('@/components/games/MemoryGrid')),
  'word-sprint':   load('word-sprint',   () => import('@/components/games/WordSprint')),
  'speed-tap':     load('speed-tap',     () => import('@/components/games/SpeedTap')),
  'trivia':        load('trivia',        () => import('@/components/games/TriviaGame')),
  'avatar-maker':  load('avatar-maker',  () => import('@/components/games/AvatarMaker')),
};

/**
 * Resolve a cartridge by id — returns null if no loader is registered.
 * The returned cartridge can be passed straight to `<GameRuntime cartridge={…}/>`.
 */
export async function loadCartridge(id: string): Promise<GameCartridge | null> {
  const loader = CARTRIDGE_LOADERS[id];
  if (!loader) return null;
  return loader();
}

/** Stable list of registered cartridge ids. */
export function getCartridgeIds(): string[] {
  return Object.keys(CARTRIDGE_LOADERS);
}
