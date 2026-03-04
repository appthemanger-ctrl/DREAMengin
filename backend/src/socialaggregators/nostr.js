import { relayInit, generatePrivateKey, getPublicKey, getEventHash, signEvent } from 'nostr-tools';

export default class NostrAggregator {
  constructor() {
    this.relays = [
      'wss://relay.damus.io',
      'wss://nostr-pub.wellorder.net',
      'wss://relay.nostr.ch'
    ];
  }

  async getTrendingPosts(limit = 50) {
    const posts = [];
    
    for (const relayUrl of this.relays) {
      const relay = relayInit(relayUrl);
      await relay.connect();
      
      const events = await relay.list([
        {
          kinds: [1],
          limit: Math.floor(limit/this.relays.length)
        }
      ]);
      
      posts.push(...events.map(event => this.normalizePost(event)));
      relay.close();
    }

    return posts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  normalizePost(event) {
    return {
      id: `nostr_${event.id}`,
      content: event.content,
      author: {
        handle: `npub${event.pubkey.substring(0, 16)}...`,
        displayName: '',
        avatar: null
      },
      mediaUrl: this.extractMediaUrl(event.content),
      engagement: {
        likes: 0, // Will be tracked on-chain
        reposts: 0,
        comments: 0
      },
      timestamp: new Date(event.created_at * 1000),
      originalUrl: `nostr:${event.id}`,
      platform: 'nostr',
      rawEvent: event
    };
  }

  extractMediaUrl(content) {
    const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|mp4|mov))/i;
    const match = content.match(urlRegex);
    return match ? match[0] : null;
  }
}