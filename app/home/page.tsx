import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HomeFeed from '@/components/HomeFeed';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let user = null;
  let profile = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let posts: any[] = [];

  try {
    const supabase = await createServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;

    if (!user) {
      redirect('/login');
    }

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
      .select(`
        *,
        profiles!inner(handle, display_name, avatar_url)
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(30);
    posts = postsData || [];
  } catch {
    redirect('/login');
  }

  return (
    <HomeFeed
      userId={user?.id || ''}
      userHandle={profile?.handle || user?.email?.split('@')[0] || 'user'}
      userAvatar={profile?.avatar_url || null}
      userDisplayName={profile?.display_name || 'User'}
      initialPosts={posts || []}
    />
  );
}
