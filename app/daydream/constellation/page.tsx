import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import ConstellationClient from './ConstellationClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Dream Constellation — DREAMengin',
  description: 'An interactive 3-D node map of all your Dream Surfaces.',
};

export default async function ConstellationPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <ConstellationClient />;
}
