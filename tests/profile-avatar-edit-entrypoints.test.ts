import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('profile avatar edit entrypoints', () => {
  const editableAvatar = readFileSync(
    resolve(__dirname, '../components/profile/EditableAvatar.tsx'),
    'utf8',
  );
  const homeFeed = readFileSync(
    resolve(__dirname, '../components/HomeFeed.tsx'),
    'utf8',
  );
  const viewProfile = readFileSync(
    resolve(__dirname, '../app/view-profile/page.tsx'),
    'utf8',
  );

  it('defines a reusable avatar control that routes to edit-profiledream', () => {
    expect(editableAvatar).toContain('router.push(href)');
    expect(editableAvatar).toContain("aria-label={ariaLabel ?? title ?? 'Edit profile'}");
  });

  it('wires HomeFeed current-user avatars to the edit profile route', () => {
    expect(homeFeed).toContain("import EditableAvatar from '@/components/profile/EditableAvatar'");
    expect(homeFeed).toContain("const editProfileHref = '/edit-profiledream';");
    expect(homeFeed).toContain('post.profiles?.handle === userHandle ? (');
    expect(homeFeed).toContain('href={c.profile?.handle === userHandle ? editProfileHref : undefined}');
  });

  it('keeps the owner profile preview avatar linked to edit-profiledream', () => {
    expect(viewProfile).toContain('avatarEditHref="/edit-profiledream"');
  });
});
