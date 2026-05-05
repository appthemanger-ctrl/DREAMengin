// SURFACE: dreamsurface.Homedream  (framework-mandated basename: page.tsx)
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DreamBarDataBridge from '@/dreamdmbar/homedream/dream.shell.HomeSystem';
import { isOwnerEmail } from '@/lib/ai/triad';
import { isDevBypassActive } from '@/lib/dev-bypass';
import type { FeedPost } from '@/lib/feed/useLiveFeed';
import { getPrimaryPostMediaUrl } from '@/lib/media/postMedia';
import { safeGetUser } from '@/lib/supabase/safeGetUser';
import { connection } from 'next/server';

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

export default async function HomeDream() {
  await connection();

  // ── Step 1: Auth check ────────────────────────────────────────────────────
  // Next.js docs: redirect() must be called OUTSIDE try/catch blocks because
  // it works by throwing a special NEXT_REDIRECT error that must propagate
  // freely. Calling redirect() inside a try/catch swallows that throw.
  const supabase = await createServerClient();
  const user = await safeGetUser(supabase);
  const devBypass = isDevBypassActive();
  const activeUserId = user?.id ?? (devBypass ? DEV_BYPASS_USER_ID : null);

  // Guard is outside try/catch so the NEXT_REDIRECT throw propagates correctly.
  if (!user && !devBypass) redirect('/login');
  const userId = activeUserId ?? DEV_BYPASS_USER_ID;

  // ── Step 2: Data fetching — all failures are non-fatal ───────────────────
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

      const followedIds = follows.map((f) => f.following_id);
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

      const platformPosts = (postsData ?? []).map((post) => ({
        ...post,
        media_url: getPrimaryPostMediaUrl(post),
      }));

      // Attach connector feed items to the posts array under a normalised shape
      // so HomeDreamSurface / HomeFeed can render them uniformly.
      // Connector items arrive as `{ source: 'connector', ... }` alongside posts.
      const connectorEntries: FeedPost[] = feedItems.map((item) => {
        const payload = item.payload ?? {};
        const firstMedia = Array.isArray(payload.media) ? payload.media[0] : null;
        return {
          id:            item.id,
          source:        'connector' as const,
          provider:      item.provider,
          content:       payload.content_text ?? payload.title ?? '',
          visibility:    'private',
          media_url:     firstMedia?.url ?? null,
          permalink:     payload.permalink ?? undefined,
          created_at:    item.published_at ?? item.created_at ?? new Date(0).toISOString(),
          profiles: {
            handle:       payload.author_handle ?? item.provider,
            display_name: payload.author_name ?? item.provider,
            avatar_url:   payload.author_avatar ?? null,
          },
        };
      });

      // Merge and sort by created_at descending; posts first if same time
      const allEntries: FeedPost[] = [...platformPosts, ...connectorEntries];
      allEntries.sort((a, b) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      );
      posts = allEntries;
    } catch {
      // Non-fatal: render the home system with whatever data was collected.
      // The user is authenticated — we must NOT redirect here.
    }
  }

  return (
    <DreamBarDataBridge userId={userId} profile={profile} initialPosts={posts} isAdmin={isAdmin} />
  );
}
