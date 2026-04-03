import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import LabEnginApp from '@/components/engines/lab/LabEnginApp';
import { connection } from 'next/server';
export default async function LabEnginAppPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return <LabEnginApp />;
}
