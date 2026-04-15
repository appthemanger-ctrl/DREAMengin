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

import { useRouter } from 'next/navigation';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import ContentEngin from '@/engins/ContentEngin';

const ACCENT = '#fb923c';
const BACK_HREF = '/daydream/create';

const NAV_ITEMS = [
  { href: '/engines/create',          label: 'Hub',       emoji: '✨' },
  { href: '/engines/create/editor',   label: 'Editor',    emoji: '✍️' },
  { href: '/engines/create/calendar', label: 'Calendar',  emoji: '📅' },
  { href: '/engines/create/queue',    label: 'Queue',     emoji: '📬' },
];

export default function CreateEnginApp() {
  const router = useRouter();
  return (
    <EnginAppShell
      engineName="ContentEngin"
      engineEmoji="✨"
      accentColor={ACCENT}
      backHref={BACK_HREF}
      backLabel="Create Daydream"
      nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}
    >
      <div className="h-full overflow-y-auto">
        <ContentEngin onBack={() => router.push(BACK_HREF)} />
      </div>
    </EnginAppShell>
  );
}
