import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { upsertSavedGameSession } from '@/lib/games/library-state';
import { buildGameLaunchHref, DEFAULT_GAME_ID, isLaunchFlagEnabled, resolveGameLaunchId } from '@/lib/games/navigation';
import { GAME_INPUT_KEYBOARD_MAP } from '@/lib/games/useGameInputKeyboardBridge';

const REPO_ROOT = process.cwd();

describe('game launch navigation', () => {
  it('builds a direct game launch href by default', () => {
    expect(buildGameLaunchHref()).toBe(`/daydream/games?game=${DEFAULT_GAME_ID}`);
  });

  it('builds a remote launch href for a selected game', () => {
    expect(buildGameLaunchHref('snake', { openEngin: true, remote: true, play: true }))
      .toBe('/daydream/game?game=snake&openEngin=1&remote=1&play=1');
  });

  it('can request fullscreen play when the route should boot straight into the expanded game view', () => {
    expect(buildGameLaunchHref('platformer', { play: true, expand: true }))
      .toBe('/daydream/game?game=platformer&play=1&expand=1');
  });

  it('keeps valid requested game ids and falls back invalid ones', () => {
    expect(resolveGameLaunchId('snake', ['snake', DEFAULT_GAME_ID])).toBe('snake');
    expect(resolveGameLaunchId('unknown', ['snake', DEFAULT_GAME_ID])).toBe(DEFAULT_GAME_ID);
    expect(resolveGameLaunchId(null, ['snake', DEFAULT_GAME_ID], null)).toBeNull();
  });

  it('treats only 1 as an enabled launch flag', () => {
    expect(isLaunchFlagEnabled('1')).toBe(true);
    expect(isLaunchFlagEnabled('0')).toBe(false);
    expect(isLaunchFlagEnabled(null)).toBe(false);
  });

  it('keeps dedicated game sessions on a true full-screen page with a floating HUD controller', () => {
    const pageSrc = readFileSync(join(REPO_ROOT, 'app/daydream/game/page.tsx'), 'utf8');
    const shellSrc = readFileSync(join(REPO_ROOT, 'app/daydream/game/ImmersiveGameShell.tsx'), 'utf8');
    const hudSrc = readFileSync(join(REPO_ROOT, 'components/games/GameHUD.tsx'), 'utf8');

    // Page wraps the shell
    expect(pageSrc).toContain('return <ImmersiveGameShell />;');
    // Shell is a true full-screen fixed container with overflow hidden
    expect(shellSrc).toContain("position: 'fixed'");
    expect(shellSrc).toContain("height: '100dvh'");
    expect(shellSrc).toContain("overflow: 'hidden'");
    // Shell mounts the floating HUD (not GameRemote directly)
    expect(shellSrc).toContain('<GameHUD');
    // Footer is still hidden during gameplay
    expect(shellSrc).toContain("document.querySelector('footer')");
    // HUD contains GameRemote and EXIT navigation back to games daydream
    expect(hudSrc).toContain('<GameRemote');
    expect(hudSrc).toContain('/daydream/games');
  });

  it('lets the games daydream launch spotlight titles directly into immersive full-screen engine sessions', () => {
    const gamesPageSrc = readFileSync(join(REPO_ROOT, 'app/daydream/games/page.tsx'), 'utf8');

    expect(gamesPageSrc).toContain("const immersiveGameHref = (gameId: string) => buildGameLaunchHref(gameId, { openEngin: true, play: true, expand: true });");
    expect(gamesPageSrc).toContain("href: immersiveGameHref('platformer')");
    expect(gamesPageSrc).toContain("href: immersiveGameHref('dreamquest')");
    expect(gamesPageSrc).toContain("href: immersiveGameHref('dreamwars')");
    expect(gamesPageSrc).toContain("href: immersiveGameHref('neon-drift')");
    expect(gamesPageSrc).toContain("href: immersiveGameHref('echo-arena')");
  });
});

describe('shared remote keyboard bridge', () => {
  it('maps diagonal movement to combined arrow keys', () => {
    expect(GAME_INPUT_KEYBOARD_MAP['move-up-right']).toEqual([
      { key: 'ArrowUp', code: 'ArrowUp' },
      { key: 'ArrowRight', code: 'ArrowRight' },
    ]);
  });

  it('maps action buttons to keyboard-friendly fallbacks for non-native games', () => {
    expect(GAME_INPUT_KEYBOARD_MAP.jump).toEqual([{ key: 'ArrowUp', code: 'ArrowUp' }]);
    expect(GAME_INPUT_KEYBOARD_MAP.shoot).toEqual([{ key: ' ', code: 'Space' }]);
    expect(GAME_INPUT_KEYBOARD_MAP.pause).toEqual([{ key: 'Escape', code: 'Escape' }]);
  });
});

describe('saved game sessions', () => {
  it('keeps the newest saved session first and de-duplicates by game id', () => {
    expect(upsertSavedGameSession([
      { gameId: 'snake', label: 'Snake', savedAt: '2026-03-27T12:00:00.000Z', source: 'library-screen' },
      { gameId: 'tetris', label: 'Tetris', savedAt: '2026-03-27T11:00:00.000Z', source: 'fullscreen' },
    ], {
      gameId: 'snake',
      label: 'Snake',
      savedAt: '2026-03-28T01:00:00.000Z',
      source: 'fullscreen',
    })).toEqual([
      { gameId: 'snake', label: 'Snake', savedAt: '2026-03-28T01:00:00.000Z', source: 'fullscreen' },
      { gameId: 'tetris', label: 'Tetris', savedAt: '2026-03-27T11:00:00.000Z', source: 'fullscreen' },
    ]);
  });
});
