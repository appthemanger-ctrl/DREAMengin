import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { EnginAppShell, EnginNavBar } from '@/components/engines/shared';
import CalendarPanel from '@/components/engines/create/panels/CalendarPanel';
import { connection } from 'next/server';

export const metadata = { title: 'Content Calendar – ContentEngin', description: 'Plan your content week.' };

const ACCENT = '#fb923c';
const NAV_ITEMS = [
  { href: '/engines/create',          label: 'Hub',      emoji: '✨' },
  { href: '/engines/create/editor',   label: 'Editor',   emoji: '✍️' },
  { href: '/engines/create/calendar', label: 'Calendar', emoji: '📅' },
  { href: '/engines/create/queue',    label: 'Queue',    emoji: '📬' },
];

export default async function CreateCalendarPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return (
    <EnginAppShell engineName="ContentEngin" engineEmoji="✨" accentColor={ACCENT} backHref="/daydream/create" backLabel="Create Daydream" nav={<EnginNavBar items={NAV_ITEMS} accentColor={ACCENT} />}>
      <CalendarPanel />
    </EnginAppShell>
  );
}
