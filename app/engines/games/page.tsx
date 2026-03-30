import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import GameEnginApp from '@/components/engines/games/GameEnginApp';

export const dynamic = 'force-dynamic';

export default async function GamesEnginAppPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return <GameEnginApp />;
}
