import { describe, expect, it } from 'vitest';
import { buildGameLaunchHref, DEFAULT_GAME_ID, resolveGameLaunchId } from '@/lib/games/navigation';
import { GAME_INPUT_KEYBOARD_MAP } from '@/lib/games/useGameInputKeyboardBridge';

describe('game launch navigation', () => {
  it('builds a direct game launch href by default', () => {
    expect(buildGameLaunchHref()).toBe(`/daydream/games?game=${DEFAULT_GAME_ID}`);
  });

  it('builds a remote launch href for a selected game', () => {
    expect(buildGameLaunchHref('snake', { openEngin: true, remote: true }))
      .toBe('/daydream/games?game=snake&openEngin=1&remote=1');
  });

  it('keeps valid requested game ids and falls back invalid ones', () => {
    expect(resolveGameLaunchId('snake', ['snake', DEFAULT_GAME_ID])).toBe('snake');
    expect(resolveGameLaunchId('unknown', ['snake', DEFAULT_GAME_ID])).toBe(DEFAULT_GAME_ID);
    expect(resolveGameLaunchId(null, ['snake', DEFAULT_GAME_ID], null)).toBeNull();
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
