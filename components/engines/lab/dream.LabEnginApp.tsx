'use client';

/**
 * LabEnginApp — Full-screen app shell for the Lab Engine.
 *
 * Routes:
 *   /engines/lab             → full LabEngin hub
 *   /engines/lab/experiments → experiments runner
 *   /engines/lab/data        → data visualization
 *   /engines/lab/quantum     → quantum circuit canvas
 */

import { useRouter } from 'next/navigation';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import LabEngin from '@/engins/LabEngin';

const ACCENT = '#10b981';
const BACK_HREF = '/daydream/lab';

const NAV_ITEMS = [
  { href: '/engines/lab',             label: 'Hub',         emoji: '🔬' },
  { href: '/engines/lab/experiments', label: 'Experiments', emoji: '⚗️' },
  { href: '/engines/lab/data',        label: 'Data Viz',    emoji: '📊' },
  { href: '/engines/lab/quantum',     label: 'Quantum',     emoji: '⚛️' },
];

export default function LabEnginApp() {
  const router = useRouter();
  return (
    <EnginAppShell
      engineName="LabEngin"
      engineEmoji="🔬"
      accentColor={ACCENT}
      backHref={BACK_HREF}
      backLabel="Lab Daydream"
      nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}
    >
      <div className="h-full overflow-y-auto">
        <LabEngin onBack={() => router.push(BACK_HREF)} />
      </div>
    </EnginAppShell>
  );
}
