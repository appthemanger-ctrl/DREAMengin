// SURFACE: dreamsurface.EnginesPortfolioOptimize  (framework-mandated basename: page.tsx)
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import OptimizePanel from '@/components/engines/portfolio/panels/dream.panel.OptimizePanel';
import { connection } from 'next/server';

export const metadata = { title: 'Optimize – PortfolioEngin', description: 'Run quantum portfolio optimization.' };

const ACCENT    = '#2a8ab8';
const NAV_ITEMS = [
  { href: '/engines/portfolio',          label: 'Hub',      emoji: '📈' },
  { href: '/engines/portfolio/optimize', label: 'Optimize', emoji: '⚡' },
  { href: '/engines/portfolio/assets',   label: 'Assets',   emoji: '🏦' },
  { href: '/engines/portfolio/quantum',  label: 'Quantum',  emoji: '⚛️' },
];

export default async function PortfolioOptimizePage( ){
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return (
    <EnginAppShell engineName="PortfolioEngin" engineEmoji="📈" accentColor={ACCENT} backHref="/engines" backLabel="Engines" nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}>
      <OptimizePanel />
    </EnginAppShell>
  );
}