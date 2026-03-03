import { describe, expect, it } from 'vitest';

import {
  resolveGameHomeTap,
  type GameHomeButtonAction,
} from '@/lib/home-buttons/home-buttons-state';

// Tests for the in-game home button tap resolver (SPEC §game-home-button).

describe('resolveGameHomeTap', () => {
  it('single tap → pause-game', () => {
    const action: GameHomeButtonAction = resolveGameHomeTap('single');
    expect(action).toBe('pause-game');
  });

  it('double tap → open-game-menu', () => {
    const action: GameHomeButtonAction = resolveGameHomeTap('double');
    expect(action).toBe('open-game-menu');
  });
});
