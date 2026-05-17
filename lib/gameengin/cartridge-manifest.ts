/**
 * lib/gameengin/cartridge-manifest.ts
 *
 * MANIFEST.json schema and validator for the `.dreamr` binary cartridge format.
 * Spec: GameENGINspec.md §1.3
 *
 * Server-safe (no React, no DOM) so it can be consumed by tests, the packager
 * script, and the runtime loader.
 */

import { z } from 'zod';

/** Magic bytes "DRMR" at the start of the decompressed TAR — spec §1.1 */
export const CARTRIDGE_MAGIC = new Uint8Array([0x44, 0x52, 0x4d, 0x52]);

export const CARTRIDGE_MIME = 'application/vnd.dreamengin.cartridge';
export const CARTRIDGE_EXT = '.dreamr';

export const QualityTierSchema = z.enum(['low', 'medium', 'high', 'ultra']);
export const RenderModeSchema  = z.enum(['webgpu', 'webgl', 'canvas2d']);
export const PermissionSchema  = z.enum(['storage', 'multiplayer', 'haptics', 'gamepad', 'microphone']);

export const CartridgeManifestSchema = z.object({
  $schema: z.string().url().optional(),
  dreamr_version: z.literal(1),
  cartridge_id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/, 'lowercase kebab-case 3-64 chars'),
  title: z.string().min(1).max(120),
  author: z.string().min(1).max(120),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'semver MAJOR.MINOR.PATCH'),
  entry: z.string().endsWith('.wasm'),
  render_mode: RenderModeSchema,
  permissions: z.array(PermissionSchema).default([]),
  cover_art: z.string().optional(),
  min_quality_tier: QualityTierSchema,
  target_frame_rate: z.union([z.literal(30), z.literal(60), z.literal(120)]),
  memory_budget_mb: z.number().int().min(16).max(2048),
  save_schema_version: z.number().int().min(1),
  dependencies: z.object({
    gameengin_runtime: z.string().regex(/^(>=|<=|>|<|\^|~)?\d+\.\d+\.\d+$/),
  }),
  metadata: z.object({
    genre: z.array(z.string()).min(1),
    estimated_playtime_minutes: z.number().int().positive(),
    player_count: z.array(z.number().int().positive()).min(1),
    tags: z.array(z.string()).default([]),
  }),
});

export type CartridgeManifest = z.infer<typeof CartridgeManifestSchema>;

/** Validate a parsed JSON manifest object. Throws ZodError on failure. */
export function validateManifest(input: unknown: CartridgeManifest {
  return CartridgeManifestSchema.parse(input);
}

/** True if the first 4 bytes of `buf` match `DRMR`. */
export function hasCartridgeMagic(buf: Uint8Array | ArrayBuffer: boolean {
  const view = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  if (view.length < 4) return false;
  for (let i = 0; i < 4; i++) {
    if (view[i] !== CARTRIDGE_MAGIC[i]) return false;
  }
  return true;
}
