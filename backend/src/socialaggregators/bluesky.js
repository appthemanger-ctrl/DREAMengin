import axios from 'axios';

export default class BlueskyAggregator {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.bsky.app/xrpc/',
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${process.env.BLUESKY_ACCESS_TOKEN}`
      }
    });
  }

  async getTrendingPosts(limit = 50) {
    try {
      const response = await this.client.get('app.bsky.feed.getPopular', {
        params: { limit }
      });
      return response.data.feed.map(item => this.normalizePost(item.post));
    } catch (error) {
      console.error('Bluesky API error:', error);
      return [];
    }
  }

  normalizePost(post) {
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
  }
}