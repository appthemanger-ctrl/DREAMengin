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

    // Fetch user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = profileData;

    // Fetch posts for feed
    const { data: postsData } = await supabase
      .from('app_posts')
      .select(
        `
        *,
        profiles!inner(handle, display_name, avatar_url)
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
    <DreamNavSurface6 debug={false} disableGestures>
      <HomeSystem userId={user?.id || ''} profile={profile} initialPosts={posts || []} />
    </DreamNavSurface6>
  );
}
