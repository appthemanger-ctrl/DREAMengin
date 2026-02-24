import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DreamNavSurface6 from '@/components/dreamnav/DreamNavSurface6';
import HomeSystem from '@/components/home/HomeSystem';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let user = null;
  let profile = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let posts: any[] = [];

  try {
    const supabase = await createServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    if (!user) redirect('/login');

    // Fetch or create user profile (keeps UI from feeling "empty" when RLS/seed state is new)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profileData) {
      const handle = (user.email || '').split('@')[0] || `user-${user.id.slice(0, 8)}`;
      const { data: created } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            handle,
            display_name: handle,
          },
          { onConflict: 'id' }
        )
        .select('*')
        .single();
      profile = created;
    } else {
      profile = profileData;
    }

    // Fetch posts for feed
    const { data: postsData } = await supabase
      .from('app_posts')
      .select(
        `
        *,
        profiles(handle, display_name, avatar_url)
      `
      )
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(30);

    posts = postsData || [];
  } catch {
    redirect('/login');
  }

  return (
    <DreamNavSurface6 debug={false}>
      <HomeSystem userId={user?.id || ''} profile={profile} initialPosts={posts || []} />
    </DreamNavSurface6>
  );
}
