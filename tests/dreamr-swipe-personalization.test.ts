import { describe, expect, it } from 'vitest';
import {
  contentTypePreferenceKey,
  canRecordDreamRView,
  emptyDreamRSwipePreferences,
  nextSwipePreferences,
  personalizeFeedOrder,
  shouldRecordDreamRView,
  type DreamRSwipePost,
} from '@/lib/dreamr/swipePersonalization';

function post(overrides: Partial<DreamRSwipePost>): DreamRSwipePost {
  return {
    id: 'p',
    content: 'short human thought',
    provider: 'dreamengin',
    media_url: null,
    profiles: { handle: 'creator' },
    ...overrides,
  };
}

describe('DreamR swipe personalization', () => {
  it('classifies connector providers and native media types', () => {
    expect(contentTypePreferenceKey(post({ provider: 'youtube' }))).toBe('youtube');
    expect(contentTypePreferenceKey(post({ media_url: 'https://cdn.test/image.webp' }))).toBe('image');
    expect(contentTypePreferenceKey(post({ media_url: 'https://cdn.test/video.mp4?x=1' }))).toBe('video');
    expect(contentTypePreferenceKey(post({ content: 'word '.repeat(60) }))).toBe('longform');
  });

  it('left swipe boosts creator/type and clears prior less signals', () => {
    const first = nextSwipePreferences(emptyDreamRSwipePreferences(), post({ id: 'a' }), 'less');
    const next = nextSwipePreferences(first, post({ id: 'a' }), 'more');
    expect(next.moreCreators.has('creator')).toBe(true);
    expect(next.moreTypes.has('text')).toBe(true);
    expect(next.lessCreators.has('creator')).toBe(false);
    expect(next.hiddenPostIds.has('a')).toBe(false);
  });

  it('right swipe hides the current card and demotes matching creator/type', () => {
    const next = nextSwipePreferences(emptyDreamRSwipePreferences(), post({ id: 'a' }), 'less');
    expect(next.lessCreators.has('creator')).toBe(true);
    expect(next.lessTypes.has('text')).toBe(true);
    expect(next.hiddenPostIds.has('a')).toBe(true);
  });

  it('moves preferred cards earlier while preserving stable order inside equal scores', () => {
    const items = [
      { post: post({ id: 'a', profiles: { handle: 'alpha' }, media_url: 'https://cdn.test/a.jpg' }) },
      { post: post({ id: 'b', profiles: { handle: 'beta' } }) },
      { post: post({ id: 'c', profiles: { handle: 'alpha' } }) },
    ];
    const prefs = nextSwipePreferences(emptyDreamRSwipePreferences(), items[2]!.post, 'more');
    const ordered = personalizeFeedOrder(items, prefs, item => item.post);
    expect(ordered.map(item => item.post.id)).toEqual(['c', 'a', 'b']);
  });

  it('only records real views for up/dwell or left-match intent', () => {
    expect(shouldRecordDreamRView('left')).toBe(true);
    expect(shouldRecordDreamRView('up')).toBe(true);
    expect(shouldRecordDreamRView('right')).toBe(false);
  });

  it('dedupes native view recording and excludes YouTube cards', () => {
    expect(canRecordDreamRView(post({ id: 'native' }), 'up', new Set())).toBe(true);
    expect(canRecordDreamRView(post({ id: 'native' }), 'up', new Set(['native']))).toBe(false);
    expect(canRecordDreamRView(post({ id: 'yt', provider: 'youtube' }), 'left', new Set())).toBe(false);
    expect(canRecordDreamRView(post({ id: 'link', permalink: 'https://youtu.be/abc' }), 'left', new Set())).toBe(false);
    expect(canRecordDreamRView(post({ id: 'native' }), 'right', new Set())).toBe(false);
  });
});
