'use client';

/**
 * CodeEnginApp — Full-screen app shell for the Code Engine.
 *
 * Routes:
 *   /engines/code           → full CodeEngin IDE
 *   /engines/code/notebook  → live Python-style notebook
 *   /engines/code/projects  → project manager
 *   /engines/code/ai        → AI code assistant
 */

import { makeEnginApp } from '@/components/engines/shared';
import CodeEngin from '@/engins/engin.CodeEngin';

export default makeEnginApp({
  id: 'code',
  name: 'CodeEngin',
  emoji: '💻',
  accentColor: '#22d3ee',
  backHref: '/daydream/code',
  backLabel: 'Code Daydream',
  nav: [
    { href: '/engines/code',          label: 'IDE',       emoji: '💻' },
    { href: '/engines/code/notebook', label: 'Notebook',  emoji: '📓' },
    { href: '/engines/code/projects', label: 'Projects',  emoji: '📁' },
    { href: '/engines/code/ai',       label: 'AI',        emoji: '🤖' },
  ],
  EnginComponent: CodeEngin,
});
