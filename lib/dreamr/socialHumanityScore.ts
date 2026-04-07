import { createClient } from '@/lib/supabase/client';

export interface SocialHumanityInput {
  userId: string;
  creatorId: string;
  actionType: 'view' | 'like' | 'comment' | 'share';
  timestamp?: Date;
  ipHash?: string;       // anonymized IP for location consistency
}

export interface HumanityScore {
  score: number;         // 0–100
  signals: {
    followDurationDays: number;
    messageCount: number;
    mutualFollowers: number;
    likeDiversity: number;      // entropy of liked categories
    timeConsistency: number;    // 0–1, how well action time matches user's normal hours
    locationConsistency: number;
  };
  verdict: 'human' | 'bot' | 'uncertain';
  thresholdUsed: number;
}

const DEFAULT_THRESHOLD = 40; // score below this = bot

// Helper to get follow duration in days
async function getFollowDuration(supabase: any, followerId: string, followeeId: string): Promise<number> {
  const { data, error } = await supabase
    .from('follows')
    .select('created_at')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .single();
  if (error || !data) return 0;
  const days = (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60 * 24);
  return Math.min(365, Math.max(0, days)); // cap at 1 year
}

// Count messages exchanged between two users
async function getMessageCount(supabase: any, userA: string, userB: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .or(`sender_id.eq.${userA},receiver_id.eq.${userA}`)
    .or(`sender_id.eq.${userB},receiver_id.eq.${userB}`);
  if (error) return 0;
  return count || 0;
}

// Count mutual followers (users who follow both)
async function getMutualFollowers(supabase: any, userId: string, creatorId: string): Promise<number> {
  const { data: userFollowers } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('followee_id', userId);
  const { data: creatorFollowers } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('followee_id', creatorId);
  const userSet = new Set(userFollowers?.map(f => f.follower_id) || []);
  const mutual = (creatorFollowers || []).filter(f => userSet.has(f.follower_id)).length;
  return mutual;
}

// Like diversity: entropy of categories of posts they've liked
async function getLikeDiversity(supabase: any, userId: string): Promise<number> {
  const { data } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', userId)
    .limit(50);
  if (!data || data.length === 0) return 0;
  // In a real system, join with posts table to get categories. Here we simulate with post id distribution.
  const freq = new Map<string, number>();
  for (const like of data) {
    const cat = like.post_id.slice(0, 2); // dummy category
    freq.set(cat, (freq.get(cat) || 0) + 1);
  }
  let entropy = 0;
  const total = data.length;
  for (const count of freq.values()) {
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(freq.size || 1);
  return maxEntropy === 0 ? 0 : entropy / maxEntropy;
}

// Time consistency: does this action happen during user's typical active hours?
async function getTimeConsistency(supabase: any, userId: string, actionHour: number): Promise<number> {
  // Get last 20 actions (likes, comments, shares) with timestamps
  const { data } = await supabase
    .from('user_actions')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (!data || data.length < 5) return 0.5; // neutral
  const hours = data.map(a => new Date(a.created_at).getHours());
  const meanHour = hours.reduce((a,b) => a+b,0) / hours.length;
  const std = Math.sqrt(hours.map(h => Math.pow(h - meanHour, 2)).reduce((a,b)=>a+b,0) / hours.length);
  const deviation = Math.abs(actionHour - meanHour);
  const z = deviation / (std + 0.01);
  return Math.max(0, Math.min(1, 1 - z / 2));
}

// Location consistency: compare IP hash with recent activity (simplified)
async function getLocationConsistency(supabase: any, userId: string, currentIpHash: string): Promise<number> {
  const { data } = await supabase
    .from('user_actions')
    .select('ip_hash')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (!data || data.length === 0) return 0.5;
  const matchCount = data.filter(a => a.ip_hash === currentIpHash).length;
  return matchCount / data.length;
}

// Main scoring function
export async function computeSocialHumanityScore(input: SocialHumanityInput): Promise<HumanityScore> {
  const supabase = createClient();
  const now = input.timestamp || new Date();
  const actionHour = now.getHours();

  // Gather signals
  const [followDays, messageCount, mutualFollowers, likeDiversity, timeConsistency, locationConsistency] = await Promise.all([
    getFollowDuration(supabase, input.userId, input.creatorId),
    getMessageCount(supabase, input.userId, input.creatorId),
    getMutualFollowers(supabase, input.userId, input.creatorId),
    getLikeDiversity(supabase, input.userId),
    getTimeConsistency(supabase, input.userId, actionHour),
    input.ipHash ? getLocationConsistency(supabase, input.userId, input.ipHash) : Promise.resolve(0.5),
  ]);

  // Normalize each signal to a 0–1 subscore
  const followScore = Math.min(1, followDays / 30);      // 30 days = 1.0
  const messageScore = Math.min(1, messageCount / 20);   // 20 messages = 1.0
  const mutualScore = Math.min(1, mutualFollowers / 5);  // 5 mutuals = 1.0
  const diversityScore = likeDiversity;                  // already 0–1
  const timeScore = timeConsistency;                     // already 0–1
  const locationScore = locationConsistency;             // already 0–1

  // Weighted equation (weights sum to 1.0)
  const weights = {
    follow: 0.25,
    message: 0.20,
    mutual: 0.15,
    diversity: 0.15,
    time: 0.15,
    location: 0.10,
  };

  const rawScore = 
    followScore * weights.follow +
    messageScore * weights.message +
    mutualScore * weights.mutual +
    diversityScore * weights.diversity +
    timeScore * weights.time +
    locationScore * weights.location;

  const score = Math.round(rawScore * 100);

  const verdict = score >= DEFAULT_THRESHOLD ? 'human' : (score < 20 ? 'bot' : 'uncertain');

  return {
    score,
    signals: {
      followDurationDays: followDays,
      messageCount,
      mutualFollowers,
      likeDiversity: diversityScore,
      timeConsistency: timeScore,
      locationConsistency: locationScore,
    },
    verdict,
    thresholdUsed: DEFAULT_THRESHOLD,
  };
}
