// SURFACE: dreamsurface.SettingsPrivacy  (framework-mandated basename: page.tsx)
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PrivacyClient from './dream.PrivacyClient';
import { connection } from 'next/server';

export const metadata = { title: 'Privacy – Dreamengin Settings' };

export default async function PrivacySettingsPage( ){
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <PrivacyClient />;
}