import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FeedSettingsClient from './FeedSettingsClient';
import { connection } from 'next/server';

export const metadata = { title: 'Feed Settings – Dreamengin' };

export default async function FeedSettingsPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <FeedSettingsClient />;
}
