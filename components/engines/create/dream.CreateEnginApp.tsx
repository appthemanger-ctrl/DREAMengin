'use client';

/**
 * CreateEnginApp — Full-screen app shell for the Content Creation Engine.
 *
 * Routes:
 *   /engines/create           → full ContentEngin hub
 *   /engines/create/editor    → rich content editor
 *   /engines/create/calendar  → content calendar
 *   /engines/create/queue     → publishing queue
 */

import { makeEnginApp } from '@/components/engines/shared';
import ContentEngin from '@/engins/engin.ContentEngin';

export default makeEnginApp({
  id: 'create',
  name: 'ContentEngin',
  emoji: '✨',
  accentColor: '#fb923c',
  backHref: '/daydream/create',
  backLabel: 'Create Daydream',
  nav: [
    { href: '/engines/create',          label: 'Hub',      emoji: '✨' },
    { href: '/engines/create/editor',   label: 'Editor',   emoji: '✍️' },
    { href: '/engines/create/calendar', label: 'Calendar', emoji: '📅' },
    { href: '/engines/create/queue',    label: 'Queue',    emoji: '📬' },
  ],
  EnginComponent: ContentEngin,
});
