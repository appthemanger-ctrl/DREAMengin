import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HomeSystem from '@/components/home/HomeSystem';
import { isOwnerEmail } from '@/lib/ai/triad';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let user = null;
  let profile = null;
   
  let posts: any[] = [];
  let isAdmin = false;

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

    // Determine admin status: owner email OR user_roles table
    if (isOwnerEmail(user.email)) {
      isAdmin = true;
    } else {
       
      const { data: roleData } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      isAdmin = (roleData as { role?: string } | null)?.role === 'admin';
    }

    // Phase 8 §A Point 1 & 2: Fetch from feed_items (connector-synced content)
    // + app_posts (platform posts from followed users) — merged unified feed.
    //
    // feed_items: private connector items (Mastodon, GitHub, Bluesky, etc.)
    // app_posts:  public posts from users the authenticated user follows + own posts.

    // Stream 1: connector feed items (Phase 8 §A Point 2)
     
    const { data: feedItems } = await (supabase as any)
      .from('feed_items')
      .select('id, provider, payload, published_at, created_at')
      .eq('user_id', user.id)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(20);

    // Stream 2: followed users' public posts (Phase 8 §A Point 1)
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followedIds = (follows ?? []).map((f: { following_id: string }) => f.following_id);
    const authorIds = [user.id, ...followedIds];

    const { data: postsData } = await supabase
      .from('app_posts')
      .select(
        `*,
        profiles!inner(handle, display_name, avatar_url)`
      )
      .in('user_id', authorIds)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(30);

    posts = postsData || [];

    // Attach connector feed items to the posts array under a normalised shape
    // so WorkspaceDashboard / HomeFeed can render them uniformly.
    // Connector items arrive as `{ source: 'connector', ... }` alongside posts.
     
    const connectorEntries = (feedItems ?? []).map((item: any) => {
       
      const p = (item.payload ?? {}) as Record<string, any>;
      return {
        id:          item.id,
        source:      'connector' as const,
        provider:    item.provider,
        content:     p.content_text ?? p.title ?? '',
        author_handle: p.author_handle,
        author_name:   p.author_name,
        media_url:     Array.isArray(p.media) && p.media.length > 0 ? p.media[0].url : null,
        permalink:     p.permalink,
        created_at:  item.published_at ?? item.created_at,
        // Stub profile shape for unified rendering
        profiles: {
          handle:       p.author_handle ?? item.provider,
          display_name: p.author_name   ?? item.provider,
          avatar_url:   p.author_avatar ?? null,
        },
      };
    });

    // Merge and sort by created_at descending; posts first if same time
     
    const allEntries: any[] = [...posts, ...connectorEntries];
    allEntries.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    posts = allEntries;

  } catch {
    redirect('/login');
  }

  return (
    <HomeSystem userId={user?.id || ''} profile={profile} initialPosts={posts || []} isAdmin={isAdmin} />
  );
}
