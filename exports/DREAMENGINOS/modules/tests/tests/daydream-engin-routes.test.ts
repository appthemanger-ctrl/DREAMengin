import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

const ENGIN_ROUTES = [
  ['music', 'StarMakerEngin', 'music'],
  ['games', 'GameEngin',      'games'],
  ['lab',   'LabEngin',       'lab'],
  ['code',  'CodeEngin',      'code'],
  ['brand', 'BrandingEngin',  'brand'],
  ['create','ContentEngin',   'create'],
] as const;

describe('standalone /daydream/*/engin routes', () => {
  it('StandaloneEnginSurface still references all six engine components', () => {
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

  for (const [route, engin, engineSlug] of ENGIN_ROUTES) {
    it(`/daydream/${route}/engin redirects to the standalone /engines/${engineSlug} app`, () => {
      const source = readFileSync(
        join(root, `app/daydream/${route}/engin/page.tsx`),
        'utf-8'
      );

      // Legacy routes now redirect to the new standalone engine apps
      expect(source).toContain(`redirect('/engines/${engineSlug}')`);
      // Must NOT redirect back to daydream (would create a loop)
      expect(source).not.toContain("redirect('/daydream/");
      expect(source).not.toContain('redirect("/daydream/');
    });

    it(`/engines/${engineSlug} has a standalone page wrapping ${engin}`, () => {
      const source = readFileSync(
        join(root, `app/engines/${engineSlug}/page.tsx`),
        'utf-8'
      );

      // The standalone engine page must render the engine's App component
      const appComponentName = engin === 'StarMakerEngin' ? 'MusicEnginApp'
        : engin === 'BrandingEngin' ? 'BrandEnginApp'
        : engin === 'ContentEngin'  ? 'CreateEnginApp'
        : `${engin.replace('Engin', 'Engin')}App`;

      // Either directly references the App or the base Engin component
      const hasEngineRef = source.includes(appComponentName) || source.includes(engin);
      expect(hasEngineRef).toBe(true);
    });
  }
});
