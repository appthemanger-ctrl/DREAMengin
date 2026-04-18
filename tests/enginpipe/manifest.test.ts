/**
 * tests/enginpipe/manifest.test.ts
 *
 * Unit tests for the generic Engin artifact manifest schema.
 */

import { describe, it, expect } from 'vitest';
import {
  EnginArtifactManifestSchema,
  parseManifest,
  safeParseManifest,
  createManifest,
} from '@/lib/enginpipe/artifact/manifest';

describe('enginpipe / artifact manifest', () => {
  const minimal = {
    artifact_format_version: 1,
    artifact_id: 'mad-maxi',
    title: 'Mad Maxi',
    entry: 'logic/main.wasm',
  };

  it('accepts a minimal valid manifest and applies defaults', () => {
    const m = parseManifest(minimal);
    expect(m.artifact_id).toBe('mad-maxi');
    expect(m.permissions).toEqual([]);
    expect(m.assets_manifest).toEqual({});
    expect(m.save_schema_version).toBe(1);
    expect(m.metadata).toEqual({});
  });

  it('createManifest fills defaults from the required subset', () => {
    const m = createManifest({
      artifact_id: 'demo-engin',
      title: 'Demo',
      entry: 'main.js',
    });
    expect(m.artifact_format_version).toBe(1);
    expect(m.permissions).toEqual([]);
  });

  it('rejects invalid artifact_id (uppercase, too short)', () => {
    expect(() => parseManifest({ ...minimal, artifact_id: 'AB' })).toThrow();
    expect(() =>
      parseManifest({ ...minimal, artifact_id: 'Has Space' }),
    ).toThrow();
  });

  it('rejects unknown permissions', () => {
    const r = safeParseManifest({
      ...minimal,
      permissions: ['storage', 'banana'],
    });
    expect(r.success).toBe(false);
  });

  it('round-trips through Zod parse', () => {
    const full = {
      ...minimal,
      permissions: ['storage', 'audio'],
      assets_manifest: { textures: 'sprites/' },
      save_schema_version: 2,
      metadata: { genre: 'arcade' },
    };
    const parsed = EnginArtifactManifestSchema.parse(full);
    expect(parsed.permissions).toEqual(['storage', 'audio']);
    expect(parsed.save_schema_version).toBe(2);
    expect(parsed.metadata.genre).toBe('arcade');
  });

  it('requires artifact_format_version === 1', () => {
    expect(() => parseManifest({ ...minimal, artifact_format_version: 2 })).toThrow();
  });
});
