'use client';

/**
 * GameRemote — compatibility export for the legacy Side-B remote surface.
 *
 * Immersive full-screen game sessions now use GameHUD/MobileGameHUD as the
 * universal in-game controller layer. The old dual-stick panel remains
 * available for legacy Daydream / Side-B remote workflows via this export.
 */

export { type GameInputAction } from '@/components/games/LegacyGameRemote';
export { default } from '@/components/games/LegacyGameRemote';
