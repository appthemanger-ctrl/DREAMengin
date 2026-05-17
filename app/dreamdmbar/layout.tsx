import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { safeGetUser } from '@/lib/supabase/safeGetUser';
import { isOwnerEmail } from '@/lib/ai/triad';
import { isDevBypassActive } from '@/lib/dev-bypass';
import type { FeedPost } from '@/lib/feed/useLiveFeed';
import { getPrimaryPostMediaUrl } from '@/lib/media/postMedia';
import DreamBarDataBridge from '@/app/dreamdmbar/_components/DreamBarDataBridge';
import GlobalDreamBar from '@/components/home/dream.bar.GlobalDreamBar';
import PersistentDreamBar from '@/components/home/dream.bar.PersistentDreamBar';

const DEV_BYPASS_USER_ID = 'dev-bypass-user';

type ProfileRow = {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type UserRoleRow = {
  role: string | null;
};

type FollowRow = {
  following_id: string;
};

type AppPostRow = FeedPost & {
  media_urls?: string[] | null;
  media_json?: unknown;
};

type FeedItemPayload = {
  title?: string;
  content_text?: string;
  author_handle?: string | null;
  author_name?: string | null;
  author_avatar?: string | null;
  permalink?: string | null;
  media?: Array<{ url?: string | null }>;
};

type FeedItemRow = {
  id: string;
  provider: string;
  payload: FeedItemPayload | null;
  published_at: string | null;
  created_at: string | null;
};

export default async function DreamDMBarLayout({ children }: { children: React.ReactNode } {
  await connection();

  const supabase = await createServerClient();
  const user = await safeGetUser(supabase);
  const devBypass = isDevBypassActive();
  const activeUserId = user?.id ?? (devBypass ? DEV_BYPASS_USER_ID : null);

  if (!user && !devBypass) redirect('/login');

  const userId = activeUserId ?? DEV_BYPASS_USER_ID;

  let profile = null;
  let posts: FeedPost[] = [];
  let isAdmin = false;

  if (user) {
    try {
      const isOwner = isOwnerEmail(user.email);
      const [profileResult, roleResult, feedItemsResult, followsResult] = await Promise.allSettled([
        supabase
          .from('profiles')
          .select('id, handle, display_name, avatar_url')
          .eq('id', user.id)
          .single<ProfileRow>(),
        isOwner
          ? Promise.resolve({ data: { role: 'admin' } satisfies UserRoleRow })
          : supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .single<UserRoleRow>(),
        supabase
          .from('feed_items')
          .select('id, provider, payload, published_at, created_at')
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(20),
        supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .returns<FollowRow[]>(),
      ]);

      profile = profileResult.status === 'fulfilled' ? profileResult.value.data ?? null : null;
      const roleData = roleResult.status === 'fulfilled' ? roleResult.value.data ?? null : null;
      isAdmin = isOwner || roleData?.role === 'admin';

      const feedItems: FeedItemRow[] = feedItemsResult.status === 'fulfilled'
        ? (feedItemsResult.value.data as FeedItemRow[] | null) ?? []
        : [];
      const follows = followsResult.status === 'fulfilled' ? followsResult.value.data ?? [] : [];

      const followedIds = follows.map((f: Record<string, unknown>) => f.following_id);
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
        .limit(30)
        .returns<AppPostRow[]>();

      const platformPosts = (postsData ?? []).map((post: Record<string, unknown>) => ({
        ...post,
        media_url: getPrimaryPostMediaUrl(post),
      }));

      const connectorEntries: FeedPost[] = feedItems.map((item: Record<string, unknown>) => {
        const payload = item.payload ?? {};
        const firstMedia = Array.isArray(payload.media) ? payload.media[0] : null;
        return {
          id: item.id,
          source: 'connector' as const,
          provider: item.provider,
          content: payload.content_text ?? payload.title ?? '',
          visibility: 'private',
          media_url: firstMedia?.url ?? null,
          permalink: payload.permalink ?? undefined,
          created_at: item.published_at ?? item.created_at ?? new Date(0).toISOString(),
          profiles: {
            handle: payload.author_handle ?? item.provider,
            display_name: payload.author_name ?? item.provider,
            avatar_url: payload.author_avatar ?? null,
          },
        };
      });

      const allEntries: FeedPost[] = [...platformPosts, ...connectorEntries];
      allEntries.sort(a: Record<string, unknown>, b: Record<string, unknown> =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
      );
      posts = allEntries;
    } catch {
      // Non-fatal: render shell with available data.
    }
  }

  return (
    <>
      <DreamBarDataBridge userId={userId} profile={profile} initialPosts={posts} isAdmin={isAdmin} />
      <Suspense><GlobalDreamBar /></Suspense>
      <Suspense><PersistentDreamBar /></Suspense>
      {children}
    </>
  );
}
