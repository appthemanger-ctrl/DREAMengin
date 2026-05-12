// SURFACE: dreamsurface.EnginesGames  (framework-mandated basename: page.tsx)
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import GameEnginApp from '@/components/engines/games/dream.GameEnginApp';
import { connection } from 'next/server';
import { buildLoginRedirectPath } from '@/lib/auth/nextRedirect';


interface GamesEnginAppPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GamesEnginAppPage(props?: GamesEnginAppPageProps) {
  await connection();
  const searchParams = props?.searchParams;
  const currentSearchParams = searchParams ? await searchParams : undefined;
  const supabase = await createServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch { /* Supabase not configured — treat as unauthenticated */ }
  if (!user && !isDevBypassActive()) redirect(buildLoginRedirectPath('/engines/games', currentSearchParams));
  return <GameEnginApp />;
}
