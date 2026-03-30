import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isDevBypassActive } from '@/lib/dev-bypass';
import BrandEnginApp from '@/components/engines/brand/BrandEnginApp';
export const dynamic = 'force-dynamic';
export default async function BrandEnginAppPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isDevBypassActive()) redirect('/login');
  return <BrandEnginApp />;
}
