import MastodonAggregator from '../social-aggregators/mastodon.js';
import NostrAggregator from '../social-aggregators/nostr.js';
import BlueskyAggregator from '../social-aggregators/bluesky.js';

const mastodon = new MastodonAggregator();
const nostr = new NostrAggregator();
const bluesky = new BlueskyAggregator();

export const getCombinedFeed = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const limitPerPlatform = Math.ceil(limit / 3);
    
    const [mastodonPosts, nostrPosts, blueskyPosts] = await Promise.allSettled([
      mastodon.getTrendingPosts(limitPerPlatform),
      nostr.getTrendingPosts(limitPerPlatform),
      bluesky.getTrendingPosts(limitPerPlatform)
    ]);

    const combinedFeed = [
      ...(mastodonPosts.status === 'fulfilled' ? mastodonPosts.value : []),
      ...(nostrPosts.status === 'fulfilled' ? nostrPosts.value : []),
      ...(blueskyPosts.status === 'fulfilled' ? blueskyPosts.value : [])
    ].sort((a, b) => b.timestamp - a.timestamp)
     .slice(0, limit);

    res.json(combinedFeed);
  } catch (error) {
    console.error('Feed controller error:', error);
    res.status(500).json({ error: 'Failed to generate feed' });
  }
};

export const getPlatformFeed = async (req, res) => {
  try {
    const { platform } = req.params;
    const { limit = 20 } = req.query;
    
    let posts;
    switch (platform) {
      case 'mastodon':
        posts = await mastodon.getTrendingPosts(limit);
        break;
      case 'nostr':
        posts = await nostr.getTrendingPosts(limit);
        break;
      case 'bluesky':
        posts = await bluesky.getTrendingPosts(limit);
        break;
      default:
        return res.status(400).json({ error: 'Invalid platform specified' });
    }
    
    res.json(posts);
  } catch (error) {
    console.error(`[${platform}] Feed error:`, error);
    res.status(500).json({ error: `Failed to fetch ${platform} feed` });
  }
};