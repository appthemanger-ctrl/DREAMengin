import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ViewProfileAliasPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('handle')
    .eq('id', user.id)
    .single();

  if (profile?.handle) {
    redirect(`/profile/${profile.handle}`);
  }

  redirect('/profile');
}
