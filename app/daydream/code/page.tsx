import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CodeShell from '@/components/daydream/code/CodeShell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Code – DREAMengin', description: 'Build, preview, and deploy your code projects.' };

export default async function CodeDaydreamPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <CodeShell />;
}
