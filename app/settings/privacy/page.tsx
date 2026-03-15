import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PrivacyClient from './PrivacyClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Privacy – Dreamengin Settings' };

export default async function PrivacySettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <PrivacyClient />;
}
