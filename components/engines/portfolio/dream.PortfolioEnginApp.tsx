'use client';

/**
 * PortfolioEnginApp — Full-screen app shell for the Portfolio Engine.
 *
 * Routes:
 *   /engines/portfolio          → full PortfolioEngin hub
 *   /engines/portfolio/optimize → algorithm config + quantum run
 *   /engines/portfolio/assets   → asset universe selector
 *   /engines/portfolio/quantum  → quantum circuit canvas
 */

import { makeEnginApp } from '@/components/engines/shared';
import PortfolioEngin from '@/engins/portfolio/dream.PortfolioEngin';

export default makeEnginApp({
  id: 'portfolio',
  name: 'PortfolioEngin',
  emoji: '📈',
  accentColor: '#2a8ab8',
  backHref: '/engines',
  backLabel: 'Engines',
  nav: [
    { href: '/engines/portfolio',          label: 'Hub',      emoji: '📈' },
    { href: '/engines/portfolio/optimize', label: 'Optimize', emoji: '⚡' },
    { href: '/engines/portfolio/assets',   label: 'Assets',   emoji: '🏦' },
    { href: '/engines/portfolio/quantum',  label: 'Quantum',  emoji: '⚛️' },
  ],
  EnginComponent: PortfolioEngin,
});
