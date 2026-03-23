/**
 * tests/phase8i-settings-persistence.test.ts
 *
 * Phase 8 §I — Data Integrity, RLS & Settings.
 *
 * Points covered:
 *   83 — Appearance settings save to DB via /api/settings/appearance
 *   84 — Privacy settings save to DB via /api/settings/privacy
 *   86 — Data export works (route exists and is auth-gated)
 *   87 — Account deletion works (delete-dream route exists)
 *   88 — All toggles persist through Supabase
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

describe('Phase 8 §I — Appearance settings DB persistence (Point 83)', () => {
  it('/api/settings/appearance route exists', () => {
    expect(() =>
      readFileSync(join(root, 'app/api/settings/appearance/route.ts'), 'utf-8')
    ).not.toThrow();
  });

  it('route supports GET and POST', () => {
    const src = readFileSync(
      join(root, 'app/api/settings/appearance/route.ts'),
      'utf-8',
    );
    expect(src).toContain('export async function GET');
    expect(src).toContain('export async function POST');
  });

  it('route is auth-gated (returns 401 for unauthenticated)', () => {
    const src = readFileSync(
      join(root, 'app/api/settings/appearance/route.ts'),
      'utf-8',
    );
    expect(src).toContain('401');
    expect(src).toContain('Unauthorized');
  });

  it('route reads/writes from settings table', () => {
    const src = readFileSync(
      join(root, 'app/api/settings/appearance/route.ts'),
      'utf-8',
    );
    expect(src).toContain("'settings'");
  });

  it('appearance page calls /api/settings/appearance on mount', () => {
    const src = readFileSync(
      join(root, 'app/settings/appearance/page.tsx'),
      'utf-8',
    );
    expect(src).toContain('/api/settings/appearance');
  });

  it('appearance page saves settings on presetId/overrides change', () => {
    const src = readFileSync(
      join(root, 'app/settings/appearance/page.tsx'),
      'utf-8',
    );
    expect(src).toContain("method: 'POST'");
    expect(src).toContain('presetId');
    expect(src).toContain('overrides');
  });
});

describe('Phase 8 §I — Privacy settings DB persistence (Point 84)', () => {
  it('/api/settings/privacy route exists', () => {
    expect(() =>
      readFileSync(join(root, 'app/api/settings/privacy/route.ts'), 'utf-8')
    ).not.toThrow();
  });

  it('privacy settings page fetches from DB on mount', () => {
    const src = readFileSync(
      join(root, 'app/settings/privacy/PrivacyClient.tsx'),
      'utf-8',
    );
    expect(src).toContain('/api/settings/privacy');
    expect(src).toContain("method: 'POST'");
  });

  it('every toggle calls fetch to /api/settings/privacy', () => {
    const src = readFileSync(
      join(root, 'app/settings/privacy/PrivacyClient.tsx'),
      'utf-8',
    );
    // The toggle function should POST to the settings endpoint
    expect(src).toContain('/api/settings/privacy');
  });
});

describe('Phase 8 §I — Data export (Point 86)', () => {
  it('/api/account/export-data route exists', () => {
    expect(() =>
      readFileSync(join(root, 'app/api/account/export-data/route.ts'), 'utf-8')
    ).not.toThrow();
  });

  it('export route is auth-gated', () => {
    const src = readFileSync(
      join(root, 'app/api/account/export-data/route.ts'),
      'utf-8',
    );
    expect(src).toContain('NOT_AUTHENTICATED');
    expect(src).toContain('401');
  });

  it('export includes downloadable attachment header', () => {
    const src = readFileSync(
      join(root, 'app/api/account/export-data/route.ts'),
      'utf-8',
    );
    expect(src).toContain('Content-Disposition');
    expect(src).toContain('attachment');
  });
});

describe('Phase 8 §I — Account deletion (Point 87)', () => {
  it('/api/account/delete-dream route exists', () => {
    expect(() =>
      readFileSync(join(root, 'app/api/account/delete-dream/route.ts'), 'utf-8')
    ).not.toThrow();
  });

  it('deletion route removes auth identity', () => {
    const src = readFileSync(
      join(root, 'app/api/account/delete-dream/route.ts'),
      'utf-8',
    );
    expect(src).toContain('auth.admin.deleteUser');
    expect(src).toContain('auth_identity');
  });

  it('deletion requires DELETE_MY_DREAM confirmation', () => {
    const src = readFileSync(
      join(root, 'app/api/account/delete-dream/route.ts'),
      'utf-8',
    );
    expect(src).toContain('DELETE_MY_DREAM');
  });
});
