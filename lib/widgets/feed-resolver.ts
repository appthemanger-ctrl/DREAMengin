// =====================================================
// Feed Host Resolver
// Resolves feed data for widgets with SELF/FOLLOW scopes
// =====================================================

import { createServerClient } from '@/lib/supabase/server';
import {
  FeedScope,
  HostResolvedStatus,
  HostKind,
  type FeedHostConfig,
  type HostResolved,
  type FeedItemSummary,
} from '@/types/widget-system-v2';

// =====================================================
// 1. FEED RESOLVER
// =====================================================

export async function resolveFeedHost(
  ownerId: string,
  hostConfig: FeedHostConfig
): Promise<HostResolved> {
  const supabase = await createServerClient();
  
  try {
    // Verify scope and permissions
    const scopeValid = await verifyScopePermissions(supabase, ownerId, hostConfig);
    if (!scopeValid) {
      return {
        kind: HostKind.HOST_FEED_VIEW,
        status: HostResolvedStatus.FORBIDDEN,
        error_message: 'Access denied: follow relationship required',
      };
    }
    
    // Determine target user ID based on scope
    const targetUserId =
      hostConfig.scope === FeedScope.SELF ? ownerId : hostConfig.target_user_id;
    
    if (!targetUserId) {
      return {
        kind: HostKind.HOST_FEED_VIEW,
        status: HostResolvedStatus.ERROR,
        error_message: 'Invalid configuration: target_user_id required for FOLLOW scope',
      };
    }
    
    // Build query for feed items
     
    let query = (supabase as any)
      .from('feed_items')
      .select('id, user_id, ts, title, summary, url, media_json, tags_json, visibility, importance_score')
      .eq('user_id', targetUserId)
      .order('ts', { ascending: false })
      .limit(hostConfig.limit);
    
    // Apply filters
    if (hostConfig.filters.tags && Array.isArray(hostConfig.filters.tags) && hostConfig.filters.tags.length > 0) {
      query = query.contains('tags_json', hostConfig.filters.tags);
    }
    
    if (hostConfig.filters.project_id) {
      query = query.eq('project_id', hostConfig.filters.project_id);
    }
    
    // Execute query
    const { data: feedItems, error } = await query;
    
    if (error) {
      console.error('Feed resolver error:', error);
      return {
        kind: HostKind.HOST_FEED_VIEW,
        status: HostResolvedStatus.ERROR,
        error_message: error.message,
      };
    }
    
    // Transform to FeedItemSummary format and fetch engagement counts
    const items: FeedItemSummary[] = await Promise.all((feedItems || []).map(async (item: Record<string, unknown>) => {
      // Fetch engagement counts for this item
       
      const { data: engagementData } = await (supabase as any)
        .from('content_engagement')
        .select('engagement_type')
        .eq('content_id', item.id);

       
      const engagementCounts = (engagementData || []).reduce((acc: { likes: number; comments: number; shares: number }, eng: { engagement_type: string }) => {
        if (eng.engagement_type === 'like') acc.likes++;
        else if (eng.engagement_type === 'comment') acc.comments++;
        else if (eng.engagement_type === 'share') acc.shares++;
        return acc;
      }, { likes: 0, comments: 0, shares: 0 });

      return {
        item_id: item.id,
        author_id: item.user_id,
        created_at: item.ts,
        text_preview: item.summary || item.title || '',
        media_preview_url: extractMediaPreviewUrl(item.media_json),
        engagement_counts: engagementCounts,
        visibility: item.visibility as 'public' | 'followers' | 'private',
      };
    }));
    
    return {
      kind: HostKind.HOST_FEED_VIEW,
      status: HostResolvedStatus.OK,
      items,
      cursor: items.length > 0 ? items[items.length - 1].created_at : null,
      etag: generateETag(items),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Feed resolver unexpected error:', error);
    return {
      kind: HostKind.HOST_FEED_VIEW,
      status: HostResolvedStatus.ERROR,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =====================================================
// 2. SCOPE VERIFICATION
// =====================================================

// Type alias for Supabase client
type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

async function verifyScopePermissions(
  supabase: SupabaseClient,
  ownerId: string,
  hostConfig: FeedHostConfig
): Promise<boolean> {
  // SELF scope: always allowed
  if (hostConfig.scope === FeedScope.SELF) {
    return true;
  }
  
  // FOLLOW scope: verify relationship
  if (hostConfig.scope === FeedScope.FOLLOW) {
    const targetUserId = hostConfig.target_user_id;
    
    if (!targetUserId) {
      return false;
    }
    
    // User can always view their own feed
    if (ownerId === targetUserId) {
      return true;
    }
    
    // Verify follow relationship exists
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', ownerId)
      .eq('following_id', targetUserId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return true;
  }
  
  return false;
}

// =====================================================
// 3. HELPERS
// =====================================================

function extractMediaPreviewUrl(mediaJson: unknown): string | undefined {
  if (!mediaJson || typeof mediaJson !== 'object') {
    return undefined;
  }
  
  const media = mediaJson as Record<string, unknown>;
  
  // Try to extract first image/video URL
  if (Array.isArray(media.images) && media.images.length > 0) {
    return media.images[0];
  }
  
  if (Array.isArray(media.videos) && media.videos.length > 0) {
    return media.videos[0];
  }
  
  if (typeof media.thumbnail === 'string') {
    return media.thumbnail;
  }
  
  return undefined;
}

function generateETag(items: FeedItemSummary[]): string {
  // Simple ETag based on item count and last updated timestamp
  if (items.length === 0) {
    return `"empty-${Date.now()}"`;
  }
  
  const lastUpdated = items[0].created_at;
  return `"${items.length}-${lastUpdated}"`;
}

// =====================================================
// 4. APP_POSTS RESOLVER (real user-created posts)
// =====================================================

/**
 * Resolves public posts from the `app_posts` table.
 *
 * Architecture justification: ARCHITECTURE.md §8.1 — server components fetch
 * feed data with visibility constraints.  Only `visibility = 'public'` rows are
 * returned so private content is never leaked (AXIOM 4 + AXIOM 5).
 *
 * @param limit - Maximum number of posts to return (default 20).
 */
export async function resolvePublicAppPosts(limit = 20): Promise<HostResolved> {
  const supabase = await createServerClient();

  try {
    const { data: posts, error } = await supabase
      .from('app_posts')
      .select('id, user_id, content, media_json, visibility, created_at')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('resolvePublicAppPosts error:', error);
      return {
        kind: HostKind.HOST_FEED_VIEW,
        status: HostResolvedStatus.ERROR,
        error_message: error.message,
      };
    }

    const items: FeedItemSummary[] = (posts || []).map((post) => ({
      item_id: post.id as string,
      author_id: post.user_id as string,
      created_at: post.created_at as string,
      text_preview: (post.content as string | null) ?? '',
      media_preview_url: extractMediaPreviewUrl(post.media_json),
      engagement_counts: { likes: 0, comments: 0, shares: 0 },
      visibility: 'public' as const,
    }));

    return {
      kind: HostKind.HOST_FEED_VIEW,
      status: HostResolvedStatus.OK,
      items,
      cursor: items.length > 0 ? items[items.length - 1].created_at : null,
      etag: generateETag(items),
      updated_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error('resolvePublicAppPosts unexpected error:', err);
    return {
      kind: HostKind.HOST_FEED_VIEW,
      status: HostResolvedStatus.ERROR,
      error_message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Subscribes to realtime inserts / updates on `app_posts` (public only).
 *
 * Feed updates are dispatched via `requestIdleCallback` (with a `setTimeout`
 * fallback) so they never block the main thread — per Widget System V2 spec
 * and ARCHITECTURE.md §11 battery / performance rules.
 *
 * @returns An unsubscribe function — call it to tear down the channel.
 */
export async function subscribeAppPostsRealtime(
  onUpdate: (items: FeedItemSummary[]) => void
): Promise<() => void> {
  const supabase = await createServerClient();

  const channel = supabase
    .channel('app_posts:public')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'app_posts',
        filter: "visibility=eq.public",
      },
      async () => {
        const resolved = await resolvePublicAppPosts();
        if (resolved.status === HostResolvedStatus.OK && resolved.items) {
          // Defer the callback to idle time so it never jank the active frame.
          // Falls back to setTimeout(0) in environments that lack the API
          // (e.g. Node.js server-side, older browsers).
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => onUpdate(resolved.items!));
          } else {
            setTimeout(() => onUpdate(resolved.items!), 0);
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// =====================================================
// 6. FEED_ITEMS REALTIME SUBSCRIPTION HELPERS (Widget System V2)
// =====================================================

export function getFeedChannelKey(scope: FeedScope, userId: string): string {
  return scope === FeedScope.SELF
    ? `feed:SELF:${userId}`
    : `feed:FOLLOW:${userId}`;
}

export async function subscribeFeedRealtime(
  ownerId: string,
  hostConfig: FeedHostConfig,
  onUpdate: (items: FeedItemSummary[]) => void
): Promise<() => void> {
  const supabase = await createServerClient();
  const targetUserId =
    hostConfig.scope === FeedScope.SELF ? ownerId : hostConfig.target_user_id;
  
  if (!targetUserId) {
    return () => {};
  }
  
  const channelKey = getFeedChannelKey(hostConfig.scope, targetUserId);
  
  const channel = supabase
    .channel(channelKey)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'feed_items',
        filter: `user_id=eq.${targetUserId}`,
      },
      async () => {
        // Debounce updates
        // Re-resolve feed on change
        const resolved = await resolveFeedHost(ownerId, hostConfig);
        if (resolved.status === HostResolvedStatus.OK && resolved.items) {
          // Use requestIdleCallback or setTimeout to avoid blocking
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => onUpdate(resolved.items!));
          } else {
            setTimeout(() => onUpdate(resolved.items!), 0);
          }
        }
      }
    )
    .subscribe();
  
  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
