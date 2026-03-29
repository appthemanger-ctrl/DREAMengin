import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StandaloneEnginSurface from '@/components/daydream/StandaloneEnginSurface';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'LabEngin – DREAMengin', description: 'Lab Daydream control layer.' };

export default async function LabEnginPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <StandaloneEnginSurface engin="LabEngin" backHref="/daydream/lab" />;
}
