'use client';

/**
 * MusicEnginApp — Full-screen app shell for the Music Engine (StarMakerEngin).
 *
 * Routes:
 *   /engines/music          → full DAW (StarMakerEngin)
 *   /engines/music/studio   → recording studio panel
 *   /engines/music/arrange  → arrangement view
 *   /engines/music/library  → preset library
 */

import { makeEnginApp } from '@/components/engines/shared';
import StarMakerEngin from '@/engins/engin.StarMakerEngin';

export default makeEnginApp({
  id: 'music',
  name: 'StarMakerEngin',
  emoji: '🎵',
  accentColor: '#a855f7',
  backHref: '/daydream/music',
  backLabel: 'Music Daydream',
  nav: [
    { href: '/engines/music',         label: 'DAW',      emoji: '🎛️' },
    { href: '/engines/music/studio',  label: 'Studio',   emoji: '🎙️' },
    { href: '/engines/music/arrange', label: 'Arrange',  emoji: '🎼' },
    { href: '/engines/music/library', label: 'Library',  emoji: '📂' },
  ],
  EnginComponent: StarMakerEngin,
});
