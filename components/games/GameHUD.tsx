'use client';

import MobileGameHUD from '@/components/games/MobileGameHUD';
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
 * The previous expandable bottom remote now lives in LegacyGameHUD.tsx for
 * older Side-B / remote-browser workflows. Dedicated play sessions should keep
 * the entire screen as the game surface with the HUD overlaid on top.
 */
export default function GameHUD({ gameLabel, mode = 'buttons', onExit }: GameHUDProps) {
  return (
    <MobileGameHUD
      gameLabel={gameLabel}
      mode={mode}
      onExit={onExit}
    />
  );
}
