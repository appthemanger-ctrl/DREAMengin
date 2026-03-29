import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StandaloneEnginSurface from '@/components/daydream/StandaloneEnginSurface';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'CodeEngin – DREAMengin', description: 'Code Daydream control layer.' };

export default async function CodeEnginPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <StandaloneEnginSurface engin="CodeEngin" backHref="/daydream/code" />;
}
