import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const pagePath = join(root, 'app/dream-effects/page.tsx');

describe('Dream Effects surface', () => {
  it('uses the shared GSAP entrance hook for feature card reveals', () => {
    const src = readFileSync(pagePath, 'utf-8');
    expect(src).toContain("import { useGsapEntrance } from '@/lib/gsap/useGsapEntrance'");
    expect(src).toContain('useGsapEntrance(cardsRef');
    expect(src).toContain('ref={cardsRef}');
  });

  it('keeps GSAP explicitly represented in the surface copy', () => {
    const src = readFileSync(pagePath, 'utf-8');
    expect(src).toContain('GSAP + Framer Motion');
    expect(src).toContain('GSAP and Framer Motion animations');
  });
});
