import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NewUserWelcomeClient from './NewUserWelcomeClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Welcome – DREAMengin' };

export default async function OnboardingPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_url')
    .eq('id', user.id)
    .single();

  return <NewUserWelcomeClient profile={profile} />;
}
