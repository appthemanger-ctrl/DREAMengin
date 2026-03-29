import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StandaloneEnginSurface from '@/components/daydream/StandaloneEnginSurface';
import { isDevBypassActive } from '@/lib/dev-bypass';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GameEngin – DREAMengin', description: 'Games Daydream control layer.' };

export default async function GamesEnginPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');

  return <StandaloneEnginSurface engin="GameEngin" backHref="/daydream/games" />;
}
