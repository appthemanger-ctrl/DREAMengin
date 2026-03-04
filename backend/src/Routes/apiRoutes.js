import { Router } from 'express';
import { 
  getCombinedFeed, 
  getPlatformFeed 
} from '../controllers/feedController.js';
import { 
  uploadContent, 
  getContent 
} from '../controllers/ipfsController.js';
import { 
  trackEngagement, 
  getEngagementStats 
} from '../controllers/engagementController.js';

const router = Router();

// Feed routes
router.get('/feed', getCombinedFeed);
router.get('/feed/:platform', getPlatformFeed);

// IPFS routes
router.post('/ipfs/upload', uploadContent);
router.get('/ipfs/content/:cid', getContent);

// Engagement routes
router.post('/engagement/track', trackEngagement);
router.get('/engagement/stats/:contentId', getEngagementStats);

export default router;