'use client';

/**
 * GameEnginApp — Full-screen app shell for the Games Engine.
 *
 * Routes:
 *   /engines/games          → main GameEngin hub
 *   /engines/games/library  → game library browser
 *   /engines/games/scores   → scores & leaderboard
 *   /engines/games/builder  → world builder tool
 */

import { makeEnginApp } from '@/components/engines/shared';
import GameEngin from '@/engins/engin.GameEngin';

export default makeEnginApp({
  id: 'games',
  name: 'GameEngin',
  emoji: '🎮',
  accentColor: '#c8981a',
  backHref: '/daydream/games',
  backLabel: 'Games Daydream',
  nav: [
    { href: '/engines/games',         label: 'Hub',        emoji: '🎮' },
    { href: '/engines/games/library', label: 'Library',    emoji: '📚' },
    { href: '/gameengin/cartridges',  label: 'Cartridges', emoji: '💾' },
    { href: '/engines/games/scores',  label: 'Scores',     emoji: '🏆' },
    { href: '/engines/games/builder', label: 'Builder',    emoji: '🗺️' },
  ],
  EnginComponent: GameEngin,
});
