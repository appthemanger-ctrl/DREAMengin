// =====================================================
// Feed Host Resolver
// Resolves feed data for widgets with SELF/FOLLOW scopes
// =====================================================

import { createClient } from '@/lib/supabase/server';
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
  const supabase = await createClient();
  
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
    let query = supabase
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
    
    // Transform to FeedItemSummary format
    const items: FeedItemSummary[] = (feedItems || []).map((item) => ({
      item_id: item.id,
      author_id: item.user_id,
      created_at: item.ts,
      text_preview: item.summary || item.title || '',
      media_preview_url: extractMediaPreviewUrl(item.media_json),
      engagement_counts: {
        // TODO: Add actual engagement counts from a separate table
        likes: 0,
        comments: 0,
        shares: 0,
      },
      visibility: item.visibility as 'public' | 'followers' | 'private',
    }));
    
    return {
      kind: HostKind.HOST_FEED_VIEW,
      status: HostResolvedStatus.OK,
      items,
      cursor: null, // TODO: Implement pagination cursor
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
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

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
      .eq('followed_id', targetUserId)
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
// 4. REALTIME SUBSCRIPTION HELPERS
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
  const supabase = await createClient();
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
