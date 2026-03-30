'use client';

/**
 * BrandEnginApp — Full-screen app shell for the Brand Engine.
 *
 * Routes:
 *   /engines/brand            → full BrandingEngin hub
 *   /engines/brand/identity   → brand identity editor
 *   /engines/brand/analytics  → analytics & A/B tests
 *   /engines/brand/campaigns  → campaign ROI calculator
 */

import { useRouter } from 'next/navigation';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import BrandingEngin from '@/components/daydream/BrandingEngin';

const ACCENT = '#f472b6';
const BACK_HREF = '/daydream/brand';

const NAV_ITEMS = [
  { href: '/engines/brand',            label: 'Hub',        emoji: '🎨' },
  { href: '/engines/brand/identity',   label: 'Identity',   emoji: '🪪' },
  { href: '/engines/brand/analytics',  label: 'Analytics',  emoji: '📈' },
  { href: '/engines/brand/campaigns',  label: 'Campaigns',  emoji: '💰' },
];

export default function BrandEnginApp() {
  const router = useRouter();
  return (
    <EnginAppShell
      engineName="BrandingEngin"
      engineEmoji="🎨"
      accentColor={ACCENT}
      backHref={BACK_HREF}
      backLabel="Brand Daydream"
      nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}
    >
      <div className="h-full overflow-y-auto">
        <BrandingEngin onBack={() => router.push(BACK_HREF)} />
      </div>
    </EnginAppShell>
  );
}
