import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DataClient from './DataClient';
import { connection } from 'next/server';

export const metadata = { title: 'Data – Dreamengin Settings' };

export default async function DataSettingsPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <DataClient />;
}
