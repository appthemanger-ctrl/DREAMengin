import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

const ENGIN_ROUTES = [
  ['music', 'StarMakerEngin'],
  ['games', 'GameEngin'],
  ['lab', 'LabEngin'],
  ['code', 'CodeEngin'],
  ['brand', 'BrandingEngin'],
  ['create', 'ContentEngin'],
] as const;

describe('standalone /daydream/*/engin routes', () => {
  it('maps every standalone route through StandaloneEnginSurface', () => {
    const wrapperSource = readFileSync(
      join(root, 'components/daydream/StandaloneEnginSurface.tsx'),
      'utf-8'
    );

    expect(wrapperSource).toContain('router.push(backHref)');
    expect(wrapperSource).toContain('GameEngin');
    expect(wrapperSource).toContain('StarMakerEngin');
    expect(wrapperSource).toContain('LabEngin');
    expect(wrapperSource).toContain('CodeEngin');
    expect(wrapperSource).toContain('BrandingEngin');
    expect(wrapperSource).toContain('ContentEngin');
  });

  for (const [route, engin] of ENGIN_ROUTES) {
    it(`/daydream/${route}/engin renders ${engin} directly instead of redirecting into Side B`, () => {
      const source = readFileSync(
        join(root, `app/daydream/${route}/engin/page.tsx`),
        'utf-8'
      );

      expect(source).toContain('StandaloneEnginSurface');
      expect(source).toContain(`engin="${engin}"`);
      expect(source).toContain(`backHref="/daydream/${route}"`);
      expect(source).not.toContain('?openEngin=1');
      expect(source).not.toContain("redirect('/daydream/");
      expect(source).not.toContain('redirect("/daydream/');
    });
  }
});
