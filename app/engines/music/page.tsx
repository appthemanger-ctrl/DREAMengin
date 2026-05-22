// SURFACE: dreamsurface.EnginesMusic  (framework-mandated basename: page.tsx)
import MusicEnginApp from '@/components/engines/music/dream.MusicEnginApp';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';


export default async function MusicEnginAppPage( ){
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return <MusicEnginApp />;
}