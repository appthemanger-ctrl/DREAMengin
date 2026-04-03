import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import CreateEnginApp from '@/components/engines/create/CreateEnginApp';
import { connection } from 'next/server';
export default async function CreateEnginAppPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return <CreateEnginApp />;
}
