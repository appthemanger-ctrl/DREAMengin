/**
 * Normalizes a post from any platform to a standard format
 * @param {Object} post - The original post object
 * @param {string} platform - The platform name ('mastodon', 'nostr', 'bluesky')
 * @returns {Object} Normalized post
 */
export const normalizePost = (post, platform) => {
    switch (platform) {
      case 'mastodon':
        return {
          id: `mastodon_${post.id}`,
          content: post.content,
          author: {
            handle: `@${post.account.acct}`,
            displayName: post.account.display_name,
            avatar: post.account.avatar
          },
          mediaUrl: post.media_attachments?.[0]?.url || null,
          engagement: {
            likes: post.favourites_count,
            reposts: post.reblogs_count,
            comments: post.replies_count
          },
          timestamp: new Date(post.created_at),
          originalUrl: post.url,
          platform: 'mastodon'
        };
      case 'nostr':
        return {
          id: `nostr_${post.id}`,
          content: post.content,
          author: {
            handle: `npub${post.pubkey.substring(0, 16)}...`,
            displayName: '', // Nostr doesn't have display names by default
            avatar: null
          },
          mediaUrl: extractMediaUrl(post.content),
          engagement: {
            likes: 0,
            reposts: 0,
            comments: 0
          },
          timestamp: new Date(post.created_at * 1000),
          originalUrl: `nostr:${post.id}`,
          platform: 'nostr',
          rawEvent: post
        };
      case 'bluesky':
        return {
          id: `bluesky_${post.uri.split('/').pop()}`,
          content: post.record.text,
          author: {
            handle: post.author.handle,
            displayName: post.author.displayName,
            avatar: post.author.avatar
          },
          mediaUrl: post.embed?.images?.[0]?.fullsize || null,
          engagement: {
            likes: post.likeCount || 0,
            reposts: post.repostCount || 0,
            comments: post.replyCount || 0
          },
          timestamp: new Date(post.indexedAt),
          originalUrl: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`,
          platform: 'bluesky'
        };
      default:
        return post;
    }
  };
  
  /**
   * Extracts the first media URL from Nostr post content
   * @param {string} content 
   * @returns {string|null} Media URL or null
   */
  export const extractMediaUrl = (content) => {
    const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|mp4|mov))/i;
    const match = content.match(urlRegex);
    return match ? match[0] : null;
  };
  
  /**
   * Formats large numbers for display (e.g., 1500 -> 1.5K)
   * @param {number} num 
   * @returns {string} Formatted number
   */
  export const formatEngagementNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };