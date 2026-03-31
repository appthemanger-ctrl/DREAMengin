import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('landing mission statement experience', () => {
  it('replaces the landing stats strip with a mission statement link', () => {
    const src = readFileSync(join(root, 'components/LandingHero.tsx'), 'utf-8');

    expect(src).toContain('href="/mission"');
    expect(src).toContain('A social platform where your individuality is the algorithm.');
    expect(src).toContain('Where creativity—not likes—gets you seen. →');
    expect(src).not.toContain("label: 'Daydreams'");
    expect(src).not.toContain("label: 'Engin Paths'");
    expect(src).not.toContain('aria-label="Platform statistics"');
  });

  it('adds a mission page with the full statement and join CTA', () => {
    const src = readFileSync(join(root, 'app/mission/page.tsx'), 'utf-8');

    expect(src).toContain('We believe social media should be about <em>you</em>');
    expect(src).toContain("That&apos;s why we built DREAMengin");
    expect(src).toContain('Now we&apos;re inviting creators, coders, and');
    expect(src).toContain('Become a Dreamer again');
    expect(src).toContain('href="/join"');
  });
});
