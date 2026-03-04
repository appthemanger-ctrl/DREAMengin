import Mastodon from 'mastodon-api';

export default class MastodonAggregator {
  constructor() {
    this.client = new Mastodon({
      access_token: process.env.MASTODON_ACCESS_TOKEN,
      api_url: 'https://mastodon.social/api/v1/',
      timeout: 10000
    });
  }

  async getTrendingPosts(limit = 50) {
    try {
      const { data } = await this.client.get('trends/statuses', { limit });
      return data.map(post => this.normalizePost(post));
    } catch (error) {
      console.error('Mastodon API error:', error);
      return [];
    }
  }

  normalizePost(post) {
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
  }
}