'use client';

import MobileGameHUD from '@/components/games/MobileGameHUD';
import GameController from '@/components/games/GameController';
import type { MobileHudMode } from '@/lib/games/mobileControls';

interface GameHUDProps {
  gameLabel: string;
  gameEmoji?: string;
  playHref?: string;
  mode?: MobileHudMode;
  onExit: () => void;
}

/**
 * GameHUD — universal full-screen in-game HUD for immersive sessions.
 *
 * Modes:
 *   'buttons'    — PS-style button cluster (default)
 *   'joystick'   — dual analogue sticks
 *   'controller' — DREAMengin floating-stick controller with full gesture
 *                  support: floating left/right sticks, tap-to-shoot,
 *                  drag-to-aim, jump-on-lift, and interactive button ring
 *                  (X · Circle · Triangle · Square · L1 · L2 · R1 · R2).
 *
 * The previous expandable bottom remote lives in LegacyGameHUD.tsx for
 * older Side-B / remote-browser workflows.
 */
export default function GameHUD({ gameLabel, gameEmoji, playHref, mode = 'buttons', onExit }: GameHUDProps) {
  if (mode === 'controller') {
    return <GameController gameLabel={gameLabel} onExit={onExit} />;
  }
  return (
    <MobileGameHUD
      gameLabel={gameLabel}
      gameEmoji={gameEmoji}
      playHref={playHref}
      mode={mode}
      onExit={onExit}
    />
  );
}
