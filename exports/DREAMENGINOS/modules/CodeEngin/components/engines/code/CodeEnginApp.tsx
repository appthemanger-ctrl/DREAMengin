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

import { useRouter } from 'next/navigation';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import CodeEngin from '@/engins/CodeEngin';

const ACCENT = '#22d3ee';
const BACK_HREF = '/daydream/code';

const NAV_ITEMS = [
  { href: '/engines/code',          label: 'IDE',       emoji: '💻' },
  { href: '/engines/code/notebook', label: 'Notebook',  emoji: '📓' },
  { href: '/engines/code/projects', label: 'Projects',  emoji: '📁' },
  { href: '/engines/code/ai',       label: 'AI',        emoji: '🤖' },
];

export default function CodeEnginApp() {
  const router = useRouter();
  return (
    <EnginAppShell
      engineName="CodeEngin"
      engineEmoji="💻"
      accentColor={ACCENT}
      backHref={BACK_HREF}
      backLabel="Code Daydream"
      nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}
    >
      <div className="h-full overflow-y-auto">
        <CodeEngin onBack={() => router.push(BACK_HREF)} />
      </div>
    </EnginAppShell>
  );
}
