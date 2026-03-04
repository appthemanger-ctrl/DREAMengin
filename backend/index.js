import express from 'express';
import cors from 'cors';
import MastodonAggregator from './src/socialaggregators/mastodon.js';
import NostrAggregator from './src/socialaggregators/nostr.js';
import BlueskyAggregator from './src/socialaggregators/bluesky.js';
import IpfsService from './services/ipfsService.js';
import LiveKitService from './services/livekitService.js';
import rateLimit from 'express-rate-limit';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', apiLimiter);

const mastodon = new MastodonAggregator();
const nostr = new NostrAggregator();
const bluesky = new BlueskyAggregator();
const ipfs = new IpfsService();
const livekit = new LiveKitService();

// Unified feed endpoint
app.get('/api/feed', async (req, res) => {
  try {
    const [mastodonPosts, nostrPosts, blueskyPosts] = await Promise.all([
      mastodon.getTrendingPosts(25),
      nostr.getTrendingPosts(25),
      bluesky.getTrendingPosts(25)
    ]);

    const combinedFeed = [
      ...mastodonPosts,
      ...nostrPosts,
      ...blueskyPosts
    ].sort((a, b) => b.timestamp - a.timestamp);

    res.json(combinedFeed);
  } catch (error) {
    console.error('Feed generation error:', error);
    res.status(500).json({ error: 'Failed to generate feed' });
  }
});

// IPFS upload endpoint
app.post('/api/ipfs/upload', async (req, res) => {
  try {
    const { content } = req.body;
    const cid = await ipfs.uploadContent(content);
    await ipfs.pinContent(cid);
    res.json({ cid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LiveKit token generation
app.post('/api/livekit/token', (req, res) => {
  const { roomName, identity } = req.body;
  if (!roomName || !identity) {
    return res.status(400).json({ error: 'Missing roomName or identity' });
  }

  const token = livekit.generateToken(roomName, identity);
  res.json({ token });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});