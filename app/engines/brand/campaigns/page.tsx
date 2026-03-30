import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import CampaignsPanel from '@/components/engines/brand/panels/CampaignsPanel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Campaigns – BrandingEngin', description: 'Campaign ROI calculator and manager.' };

const ACCENT = '#f472b6';
const NAV_ITEMS = [
  { href: '/engines/brand',            label: 'Hub',       emoji: '🎨' },
  { href: '/engines/brand/identity',   label: 'Identity',  emoji: '🪪' },
  { href: '/engines/brand/analytics',  label: 'Analytics', emoji: '📈' },
  { href: '/engines/brand/campaigns',  label: 'Campaigns', emoji: '💰' },
];

export default async function BrandCampaignsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return (
    <EnginAppShell engineName="BrandingEngin" engineEmoji="🎨" accentColor={ACCENT} backHref="/daydream/brand" backLabel="Brand Daydream" nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}>
      <CampaignsPanel />
    </EnginAppShell>
  );
}
