import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import EditorPanel from '@/components/engines/create/panels/EditorPanel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Editor – ContentEngin', description: 'Rich content editor.' };

const ACCENT = '#fb923c';
const NAV_ITEMS = [
  { href: '/engines/create',          label: 'Hub',      emoji: '✨' },
  { href: '/engines/create/editor',   label: 'Editor',   emoji: '✍️' },
  { href: '/engines/create/calendar', label: 'Calendar', emoji: '📅' },
  { href: '/engines/create/queue',    label: 'Queue',    emoji: '📬' },
];

export default async function CreateEditorPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return (
    <EnginAppShell engineName="ContentEngin" engineEmoji="✨" accentColor={ACCENT} backHref="/daydream/create" backLabel="Create Daydream" nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}>
      <EditorPanel />
    </EnginAppShell>
  );
}
