// SURFACE: dreamsurface.EnginesPortfolio  (framework-mandated basename: page.tsx)
import PortfolioEnginApp from '@/components/engines/portfolio/dream.PortfolioEnginApp';
import { isDevBypassActive } from '@/lib/dev-bypass';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
export default async function PortfolioEnginAppPage( ){
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return <PortfolioEnginApp />;
}