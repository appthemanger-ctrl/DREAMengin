import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import MusicEnginApp from '@/components/engines/music/MusicEnginApp';

export const dynamic = 'force-dynamic';

export default async function MusicEnginAppPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return <MusicEnginApp />;
}
