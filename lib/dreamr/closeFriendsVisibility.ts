/**
 * lib/dreamr/closeFriendsVisibility.ts
 *
 * Pure helpers for applying the DreamR close-friends visibility rule on
 * the server.
 *
 * Schema (see supabase/migrations/20260405000001_dreamr_feed_registry.sql):
 *   • app_posts.post_visibility  text DEFAULT 'public'
 *       — 'public'         : visible to everyone in feeds
 *       — 'close_friends'  : visible only to people on the poster's
 *                            close-friends list, plus the poster themselves
 *   • close_friends(user_id, friend_id)
 *       — user_id has friend_id in their close-friends list. RLS allows
 *         the *owner* of the list to read it. To filter the feed for an
 *         arbitrary viewer we need the inverse (which posters have THIS
 *         viewer on their list). That requires the service role.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface VisibilityCandidate {
  user_id?: string | null;
  post_visibility?: string | null;
}

/**
 * filterByCloseFriends — pure visibility filter.
 *
 * @param posts             Candidate posts (must include user_id, post_visibility).
 * @param viewerId          The viewing user's id.
 * @param allowedPosterIds  The set of poster user_ids who have included
 *                          the viewer in their close-friends list. Posts
 *                          from these users with post_visibility === 'close_friends'
 *                          will pass through; CF posts from anyone else are
 *                          dropped.
 *
 * Posts with no `post_visibility` field default to public (matches the DB
 * default). Posts authored by the viewer themselves always pass through.
 */
export function filterByCloseFriends<T extends VisibilityCandidate>(
  posts: T[],
  viewerId: string,
  allowedPosterIds: ReadonlySet<string>,
): T[] {
  return posts.filter(p => {
    const vis = p.post_visibility ?? 'public';
    if (vis !== 'close_friends') return true;
    if (p.user_id === viewerId) return true;
    if (p.user_id && allowedPosterIds.has(p.user_id)) return true;
    return false;
  });
}

/**
 * fetchCloseFriendsCircle — best-effort lookup of the set of poster ids
 * that include the given viewer in their close-friends list.
 *
 * Requires a Supabase client with permission to bypass RLS on close_friends
 * (i.e. a service-role client). If a regular auth client is passed it will
 * silently return an empty set — the visibility filter then degrades to
 * "public + own posts", which is the strictest correct behaviour.
 */
export async function fetchCloseFriendsCircle(
  serviceClient: SupabaseClient<any>,
  viewerId: string,
): Promise<Set<string>> {
  if (!viewerId) return new Set();
  const { data, error } = await serviceClient
    .from('close_friends')
    .select('user_id')
    .eq('friend_id', viewerId);
  if (error || !data) return new Set();
  return new Set(
    (data as Array<{ user_id: string }>)
      .map(r => r.user_id)
      .filter(Boolean),
  );
}

/**
 * loadVisibilityCircle — convenience wrapper that *tries* to build a
 * service-role client and fetch the circle. On any failure (missing env,
 * network error, schema mismatch) returns an empty set so the caller's
 * visibility filter behaves conservatively.
 *
 * Importing the service-client factory lazily keeps the bundle clean and
 * ensures we never crash a feed request just because the service role key
 * isn't configured in some environment.
 */
export async function loadVisibilityCircle(viewerId: string): Promise<Set<string>> {
  if (!viewerId) return new Set();
  try {
    const mod = await import('@/lib/supabase/server');
    const svc = await mod.createServiceClient();
    return await fetchCloseFriendsCircle(svc, viewerId);
  } catch {
    return new Set();
  }
}
