/**
 * lib/enginpipe/artifact/manifest.ts
 *
 * Generic "Engin Pipe" artifact manifest schema.
 *
 * This is the domain-agnostic base manifest that every Engin's artifact
 * format should adopt:
 *   - GameEngin .dreamr cartridge
 *   - CodeEngin .dreamproject
 *   - MusicEngin .dreamtrack
 *   - BrandEngin .dreambrand
 *   - LabEngin   .dreamexp
 *
 * The shape mirrors §1 ("Artifact Container Format") of the generic
 * catalog. Domain-specific Engins MAY extend this with their own fields
 * by calling `EnginArtifactManifestSchema.extend({ ... })`.
 *
 * Server-safe: pure TypeScript, no React, no DOM.
 */

import { z } from 'zod';

/** All recognised permission scopes an artifact may request. */
export const ArtifactPermissionSchema = z.enum([
  'storage',
  'network',
  'audio',
  'gamepad',
  'haptics',
  'multiplayer',
  'microphone',
  'camera',
  'midi',
]);

export type ArtifactPermission = z.infer<typeof ArtifactPermissionSchema>;

/**
 * The generic Engin artifact manifest.
 *
 * Required:
 *   - artifact_format_version  — bumped on breaking schema changes
 *   - artifact_id              — globally-unique kebab-case identifier
 *   - title                    — human-readable name
 *   - entry                    — relative path to the executable module
 *
 * Optional (have defaults):
 *   - permissions, assets_manifest, save_schema_version, metadata
 */
export const EnginArtifactManifestSchema = z.object({
  artifact_format_version: z.literal(1),
  artifact_id: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/,
      'lowercase kebab-case 3-64 chars',
    ),
  title: z.string().min(1).max(120),
  entry: z.string().min(1),
  permissions: z.array(ArtifactPermissionSchema).default([]),
  assets_manifest: z.record(z.string(), z.unknown()).default({}),
  save_schema_version: z.number().int().min(1).default(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type EnginArtifactManifest = z.infer<typeof EnginArtifactManifestSchema>;

/**
 * Parse and validate a manifest object.
 *
 * Throws ZodError on validation failure. Use {@link safeParseManifest}
 * for a non-throwing variant.
 */
export function parseManifest(input: unknown): EnginArtifactManifest {
  return EnginArtifactManifestSchema.parse(input);
}

/**
 * Non-throwing variant of {@link parseManifest}. Returns Zod's safeParse
 * result discriminated union.
 */
export function safeParseManifest(
  input: unknown,
): ReturnType<typeof EnginArtifactManifestSchema.safeParse> {
  return EnginArtifactManifestSchema.safeParse(input);
}

/**
 * Construct a manifest object with sensible defaults applied.
 *
 * Required fields must be provided; optional fields fall back to schema
 * defaults. The returned object is fully validated.
 */
export function createManifest(
  input: Pick<EnginArtifactManifest, 'artifact_id' | 'title' | 'entry'> &
    Partial<EnginArtifactManifest>,
): EnginArtifactManifest {
  return EnginArtifactManifestSchema.parse({
    artifact_format_version: 1,
    ...input,
  });
}