import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import LabEnginApp from '@/components/engines/lab/LabEnginApp';
export const dynamic = 'force-dynamic';
export default async function LabEnginAppPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return <LabEnginApp />;
}
