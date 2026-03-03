import { describe, expect, it } from 'vitest';
import { DREAMS } from '@/lib/dreams/catalog';

describe('profile dream links', () => {
  it('routes profile dream tiles to /profile', () => {
    const profileDream = DREAMS.find((dream) => dream.id === 'profile');
    const profileViewDream = DREAMS.find((dream) => dream.id === 'profile-view');

    expect(profileDream?.route).toBe('/profile');
    expect(profileViewDream?.route).toBe('/profile');
  });
});
