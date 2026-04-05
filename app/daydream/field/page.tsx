import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import DREAMfield from '@/components/daydream/DREAMfield';
import { connection } from 'next/server';

export const metadata = {
  title: 'DREAMfield — DREAMengin',
  description:
    'Your Living Creative Cosmos. Every Engin orbits your Dream Star, ' +
    'powered by Forge Momentum. Click any planet to warp to that Daydream.',
};

export default async function DREAMfieldPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <DREAMfield />;
}
