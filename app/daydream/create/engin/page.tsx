import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StandaloneEnginSurface from '@/components/daydream/StandaloneEnginSurface';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ContentEngin – DREAMengin', description: 'Create Daydream control layer.' };

export default async function CreateEnginPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <StandaloneEnginSurface engin="ContentEngin" backHref="/daydream/create" />;
}
