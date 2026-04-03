import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import DataVizPanel from '@/components/engines/lab/panels/DataVizPanel';
import { connection } from 'next/server';

export const metadata = { title: 'Data Viz – LabEngin', description: 'Visualize experiment data.' };

const ACCENT = '#10b981';
const NAV_ITEMS = [
  { href: '/engines/lab',             label: 'Hub',         emoji: '🔬' },
  { href: '/engines/lab/experiments', label: 'Experiments', emoji: '⚗️' },
  { href: '/engines/lab/data',        label: 'Data Viz',    emoji: '📊' },
  { href: '/engines/lab/quantum',     label: 'Quantum',     emoji: '⚛️' },
];

export default async function LabDataPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return (
    <EnginAppShell engineName="LabEngin" engineEmoji="🔬" accentColor={ACCENT} backHref="/daydream/lab" backLabel="Lab Daydream" nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}>
      <DataVizPanel />
    </EnginAppShell>
  );
}
