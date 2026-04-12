import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import DREAMfield from '@/components/daydream/DREAMfield';
import { connection } from 'next/server';

export const metadata = {
  title: 'Forge Analytics — DREAMengin',
  description:
    'Your Creative Intelligence Dashboard. Full-depth analytics: Forge Momentum score, ' +
    'AI-powered next steps, workflow patterns, and Engin connection map.',
};

export default async function DREAMfieldPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <DREAMfield />;
}
