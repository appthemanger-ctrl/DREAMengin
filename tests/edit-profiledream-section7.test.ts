import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('README §7 Edit ProfileDream private builder surface', () => {
  const editProfileDreamPage = readFileSync(
    resolve(__dirname, '../app/edit-profiledream/page.tsx'),
    'utf8',
  );

  it('keeps explicit View Profile / Public View preview control in the builder', () => {
    expect(editProfileDreamPage).toContain('href="/view-profile"');
    expect(editProfileDreamPage).toContain('View Profile / Public View');
    expect(editProfileDreamPage).toContain('View Profile');
  });

  it('keeps explicit Update Public View action separate from private draft save', () => {
    expect(editProfileDreamPage).toContain('Save changes privately — does not update your public profile');
    expect(editProfileDreamPage).toContain('onClick={handlePublish}');
    expect(editProfileDreamPage).toContain('Update Public View');
  });
});
