import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HomeDream from '@/components/home/HomeDream';

export const dynamic = 'force-dynamic';

export default async function HomeDreamPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch this user's own home widgets
  const { data: userWidgets } = await supabase
    .from('widget_instances')
    .select('*')
    .eq('user_id', user.id)
    .eq('space', 'home')
    .order('order');

  // Fetch publicly-visible widgets from users the current user follows
  const { data: followingWidgets } = await supabase
    .from('widget_instances')
    .select('*')
    .eq('space', 'profile')
    .in('visibility', ['public', 'followers'])
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <HomeDream
      userId={user.id}
      userWidgets={userWidgets ?? []}
      followingWidgets={followingWidgets ?? []}
    />
  );
}
