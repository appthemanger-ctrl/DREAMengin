import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import CreateEnginApp from '@/components/engines/create/CreateEnginApp';
export const dynamic = 'force-dynamic';
export default async function CreateEnginAppPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return <CreateEnginApp />;
}
