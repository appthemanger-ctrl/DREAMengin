// SURFACE: dreamsurface.EnginesCode  (framework-mandated basename: page.tsx)
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import CodeEnginApp from '@/components/engines/code/dream.CodeEnginApp';
import { connection } from 'next/server';
export default async function CodeEnginAppPage() {
  await connection();
  const supabase = await createServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch { /* Supabase not configured — treat as unauthenticated */ }
  if (!user && !isDevBypassActive()) redirect('/login');
  return <CodeEnginApp />;
}
