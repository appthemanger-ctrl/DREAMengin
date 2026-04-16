import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('View Profile public output controls in Edit ProfileDream', () => {
  const editProfileDream = readFileSync(
    resolve(__dirname, '../app/edit-profiledream/page.tsx'),
    'utf8',
  );

  it('includes a Public View preview control that routes to view-profile', () => {
    expect(editProfileDream).toContain('href="/view-profile"');
    expect(editProfileDream).toContain('Public View');
  });

  it('uses explicit Update Public View action text for publishing output', () => {
    expect(editProfileDream).toContain('Update Public View');
    expect(editProfileDream).toContain('Updating Public View…');
  });
});
