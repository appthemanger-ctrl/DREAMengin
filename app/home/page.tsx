import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HomeFeed from '@/components/HomeFeed';

export default async function Home() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch posts for feed
  const { data: posts } = await supabase
    .from('app_posts')
    .select(`
      *,
      profiles!inner(handle, display_name, avatar_url)
    `)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(30);

  return (
    <HomeFeed
      userId={user.id}
      userHandle={profile?.handle || user.email?.split('@')[0] || 'user'}
      userAvatar={profile?.avatar_url || null}
      userDisplayName={profile?.display_name || 'User'}
      initialPosts={posts || []}
    />
  );
}
