import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = readFileSync(
  join(process.cwd(), 'engins/engin.ContentEngin.tsx'),
  'utf8',
);

describe('ContentEngin publish contract', () => {
  it('publishes to the real posts API before emitting the cross-engin publish event', () => {
    expect(src).toContain("fetch('/api/posts'");
    expect(src).toContain("bridge.emit('create', 'create:published'");
  });

  it('derives publishable text instead of emitting an empty placeholder id', () => {
    expect(src).toContain('resolvePublishIntent');
    expect(src).toContain('Add draft text, a caption, or a title before broadcasting.');
  });
});
