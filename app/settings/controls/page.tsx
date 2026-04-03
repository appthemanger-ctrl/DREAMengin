import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ControlsClient from './ControlsClient';
import { connection } from 'next/server';

export const metadata = { title: 'Controls – Dreamengin Settings' };

export default async function ControlsSettingsPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <ControlsClient />;
}
