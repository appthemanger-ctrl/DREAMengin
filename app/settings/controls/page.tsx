import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ControlsClient from './ControlsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Controls – Dreamengin Settings' };

export default async function ControlsSettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <ControlsClient />;
}
