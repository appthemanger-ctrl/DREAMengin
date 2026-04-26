export interface DreamRSwipePost {
  id: string;
  content?: string | null;
  media_url?: string | null;
  provider?: string | null;
  source?: string | null;
  profiles?: {
    handle?: string | null;
    display_name?: string | null;
  } | null;
}

export interface DreamRSwipePreferenceSets {
  moreCreators: ReadonlySet<string>;
  moreTypes: ReadonlySet<string>;
  lessCreators: ReadonlySet<string>;
  lessTypes: ReadonlySet<string>;
  hiddenPostIds: ReadonlySet<string>;
}

export type DreamRSwipeIntent = 'more' | 'less';
export type DreamRViewIntent = 'left' | 'up' | 'right';

// A roughly two-sentence post stays "text"; beyond this, DreamR treats it as
// longform so right/left swipes can tune dense essays separately from quick notes.
export const LONGFORM_CONTENT_THRESHOLD = 180;
// Creator intent is weighted twice as strongly as broad content-type intent:
// "more from this person" should outrank "more text/image/video" in the next stack.
export const CREATOR_PREFERENCE_WEIGHT = 8;
export const TYPE_PREFERENCE_WEIGHT = CREATOR_PREFERENCE_WEIGHT / 2;

export function emptyDreamRSwipePreferences(): DreamRSwipePreferenceSets {
  return {
    moreCreators: new Set(),
    moreTypes: new Set(),
    lessCreators: new Set(),
    lessTypes: new Set(),
    hiddenPostIds: new Set(),
  };
}

export function creatorPreferenceKey(post: DreamRSwipePost): string {
  return (post.profiles?.handle ?? post.profiles?.display_name ?? 'unknown').trim().toLowerCase();
}

export function contentTypePreferenceKey(post: DreamRSwipePost): string {
  const provider = post.provider?.trim().toLowerCase();
  if (provider && provider !== 'dreamengin') return provider;

  const media = post.media_url?.trim().toLowerCase() ?? '';
  if (/\.(mp4|mov|webm|m4v)(\?|$)/.test(media)) return 'video';
  if (/\.(mp3|wav|ogg|m4a|flac)(\?|$)/.test(media)) return 'audio';
  if (/\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/.test(media)) return 'image';

  return (post.content?.length ?? 0) > LONGFORM_CONTENT_THRESHOLD ? 'longform' : 'text';
}

export function nextSwipePreferences(
  current: DreamRSwipePreferenceSets,
  post: DreamRSwipePost,
  intent: DreamRSwipeIntent,
): DreamRSwipePreferenceSets {
  const creator = creatorPreferenceKey(post);
  const type = contentTypePreferenceKey(post);
  const next = {
    moreCreators: new Set(current.moreCreators),
    moreTypes: new Set(current.moreTypes),
    lessCreators: new Set(current.lessCreators),
    lessTypes: new Set(current.lessTypes),
    hiddenPostIds: new Set(current.hiddenPostIds),
  };

  if (intent === 'more') {
    next.moreCreators.add(creator);
    next.moreTypes.add(type);
    next.lessCreators.delete(creator);
    next.lessTypes.delete(type);
    next.hiddenPostIds.delete(post.id);
  } else {
    next.lessCreators.add(creator);
    next.lessTypes.add(type);
    next.moreCreators.delete(creator);
    next.moreTypes.delete(type);
    next.hiddenPostIds.add(post.id);
  }

  return next;
}

export function shouldRecordDreamRView(intent: DreamRViewIntent): boolean {
  return intent === 'left' || intent === 'up';
}

export function personalizeFeedOrder<T>(
  items: readonly T[],
  preferences: DreamRSwipePreferenceSets,
  getPost: (item: T) => DreamRSwipePost | null,
): T[] {
  const hasPreferences =
    preferences.moreCreators.size > 0 ||
    preferences.moreTypes.size > 0 ||
    preferences.lessCreators.size > 0 ||
    preferences.lessTypes.size > 0 ||
    preferences.hiddenPostIds.size > 0;

  if (!hasPreferences) return [...items];

  return items
    .map((item, index) => {
      const post = getPost(item);
      if (!post) return { item, index, score: 0, hidden: false };

      const creator = creatorPreferenceKey(post);
      const type = contentTypePreferenceKey(post);
      const score =
        (preferences.moreCreators.has(creator) ? CREATOR_PREFERENCE_WEIGHT : 0) +
        (preferences.moreTypes.has(type) ? TYPE_PREFERENCE_WEIGHT : 0) -
        (preferences.lessCreators.has(creator) ? CREATOR_PREFERENCE_WEIGHT : 0) -
        (preferences.lessTypes.has(type) ? TYPE_PREFERENCE_WEIGHT : 0);

      return {
        item,
        index,
        score,
        hidden: preferences.hiddenPostIds.has(post.id),
      };
    })
    .filter(entry => !entry.hidden)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(entry => entry.item);
}
