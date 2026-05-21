// SURFACE: dreamsurface.EnginesCreate  (framework-mandated basename: page.tsx)
import CreateEnginApp from '@/components/engines/create/dream.CreateEnginApp';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
export default async function CreateEnginAppPage( ){
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return <CreateEnginApp />;
}