'use client';

/**
 * lib/feed/feedTopics.ts
 *
 * Canonical list of 30 feed topics users can toggle in FeedSettingsPanel.
 * Default active set: world news, neil degrasse tyson, tech news.
 *
 * Topics are stored in localStorage under FEED_TOPICS_KEY as a JSON
 * string[] of active topic ids.
 */

export interface FeedTopic {
  id: string;
  label: string;
}

export const ALL_TOPICS: FeedTopic[] = [
  { id: 'world-news',          label: 'World News' },
  { id: 'neil-degrasse-tyson', label: 'Neil deGrasse Tyson' },
  { id: 'tech-news',           label: 'Tech News' },
  { id: 'hip-hop',             label: 'Hip Hop' },
  { id: 'stock-market',        label: 'Stock Market' },
  { id: 'sports',              label: 'Sports' },
  { id: 'science',             label: 'Science' },
  { id: 'politics',            label: 'Politics' },
  { id: 'health-wellness',     label: 'Health & Wellness' },
  { id: 'climate-change',      label: 'Climate Change' },
  { id: 'space-exploration',   label: 'Space Exploration' },
  { id: 'ai-machine-learning', label: 'AI & Machine Learning' },
  { id: 'cryptocurrency',      label: 'Cryptocurrency' },
  { id: 'food-cooking',        label: 'Food & Cooking' },
  { id: 'travel',              label: 'Travel' },
  { id: 'fashion',             label: 'Fashion' },
  { id: 'gaming',              label: 'Gaming' },
  { id: 'movies-tv',           label: 'Movies & TV' },
  { id: 'music',               label: 'Music' },
  { id: 'business',            label: 'Business' },
  { id: 'history',             label: 'History' },
  { id: 'art-culture',         label: 'Art & Culture' },
  { id: 'nature-wildlife',     label: 'Nature & Wildlife' },
  { id: 'education',           label: 'Education' },
  { id: 'spirituality',        label: 'Spirituality' },
  { id: 'comedy',              label: 'Comedy' },
  { id: 'fitness',             label: 'Fitness' },
  { id: 'finance',             label: 'Finance' },
  { id: 'photography',         label: 'Photography' },
  { id: 'automotive',          label: 'Automotive' },
  { id: 'popular-videos',      label: 'Popular Videos' },
];

export const DEFAULT_TOPIC_IDS: string[] = [
  'world-news',
  'neil-degrasse-tyson',
  'tech-news',
];

export const FEED_TOPICS_KEY = 'de-feed-topics';

/** Load active topic ids from localStorage (falls back to defaults). */
export function loadActiveTopicIds(): string[] {
  if (typeof window === 'undefined') return DEFAULT_TOPIC_IDS;
  try {
    const raw = localStorage.getItem(FEED_TOPICS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
    }
  } catch { /* ignore */ }
  return DEFAULT_TOPIC_IDS;
}

/** Resolve active topic ids → query strings for YouTube API. */
export function topicIdsToQueries(ids: string[]): string[] {
  const idSet = new Set(ids);
  return ALL_TOPICS
    .filter((t) => idSet.has(t.id))
    .map((t) => t.label);
}
