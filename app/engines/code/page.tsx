import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import CodeEnginApp from '@/components/engines/code/CodeEnginApp';
export const dynamic = 'force-dynamic';
export default async function CodeEnginAppPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return <CodeEnginApp />;
}
