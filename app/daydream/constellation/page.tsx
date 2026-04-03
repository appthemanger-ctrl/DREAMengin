import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import ConstellationClient from './ConstellationClient';
import { connection } from 'next/server';

export const metadata = {
  title: 'Dream Constellation — DREAMengin',
  description: 'An interactive 3-D node map of all your Dream Surfaces.',
};

export default async function ConstellationPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <ConstellationClient />;
}
