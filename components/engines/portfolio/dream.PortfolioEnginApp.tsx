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

import { useRouter } from 'next/navigation';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import PortfolioEngin from '@/engins/portfolio/dream.PortfolioEngin';

const ACCENT = '#2a8ab8';
const BACK_HREF = '/engines';

const NAV_ITEMS = [
  { href: '/engines/portfolio',          label: 'Hub',      emoji: '📈' },
  { href: '/engines/portfolio/optimize', label: 'Optimize', emoji: '⚡' },
  { href: '/engines/portfolio/assets',   label: 'Assets',   emoji: '🏦' },
  { href: '/engines/portfolio/quantum',  label: 'Quantum',  emoji: '⚛️' },
];

export default function PortfolioEnginApp() {
  const router = useRouter();
  return (
    <EnginAppShell
      engineName="PortfolioEngin"
      engineEmoji="📈"
      accentColor={ACCENT}
      backHref={BACK_HREF}
      backLabel="Engines"
      nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}
    >
      <div className="h-full overflow-y-auto">
        <PortfolioEngin onBack={() => router.push(BACK_HREF)} />
      </div>
    </EnginAppShell>
  );
}
