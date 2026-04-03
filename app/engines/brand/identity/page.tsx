import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import IdentityPanel from '@/components/engines/brand/panels/IdentityPanel';
import { connection } from 'next/server';

export const metadata = { title: 'Brand Identity – BrandingEngin', description: 'Set your brand identity.' };

const ACCENT = '#f472b6';
const NAV_ITEMS = [
  { href: '/engines/brand',            label: 'Hub',       emoji: '🎨' },
  { href: '/engines/brand/identity',   label: 'Identity',  emoji: '🪪' },
  { href: '/engines/brand/analytics',  label: 'Analytics', emoji: '📈' },
  { href: '/engines/brand/campaigns',  label: 'Campaigns', emoji: '💰' },
];

export default async function BrandIdentityPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return (
    <EnginAppShell engineName="BrandingEngin" engineEmoji="🎨" accentColor={ACCENT} backHref="/daydream/brand" backLabel="Brand Daydream" nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}>
      <IdentityPanel />
    </EnginAppShell>
  );
}
