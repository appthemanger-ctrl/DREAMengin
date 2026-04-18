/**
 * scripts/gameengin/artisan-run.ts
 *
 * Artisan visual asset agent. Spec: GameENGINspec.md §3.3, §5.1, §5.2.
 *
 * Real local work:
 *   - Reads `visual-bible/characters/<cartridge>.md` and palette directives.
 *   - Records prompt manifests (deterministic, ready to feed Replicate/ComfyUI).
 * Remote work (only when REPLICATE_API_TOKEN present):
 *   - Submits an SDXL prediction for cover art and saves the URL into the
 *     output manifest. (Image download + Basis encoding requires GPU tooling
 *     not assumed here; the spec marks Basis encode as Mechanic post-process.)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';

import {
  logRDSession,
  BRAIN_ROOT,
  listTechniques,
  listMaterialRecipes,
  listCompositionPrinciples,
  recordAssetGeneration,
} from '../../lib/gameengin/brain-reader.js';

interface PromptManifest {
  cartridge_id: string;
  asset: 'cover_art' | 'environment_tileset' | 'character_sprite';
  prompt: string;
  negative_prompt: string;
  references: string[];
  techniques_applied: string[];
  seed: number;
}

function buildPromptForCover(cartridgeId: string): PromptManifest {
  const charPath = path.join(BRAIN_ROOT, 'visual-bible', 'characters', `${cartridgeId}.md`);
  const character = fs.existsSync(charPath) ? fs.readFileSync(charPath, 'utf-8') : '';
  const envPath = path.join(BRAIN_ROOT, 'visual-bible', 'environments', 'neon-wasteland.md');
  const environment = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

  // Pull a couple of techniques + recipes that apply to a cover-art task.
  const techniques = listTechniques();
  const lighting = techniques.find((t) => t.category === 'lighting');
  const modeling = techniques.find((t) => t.category === 'modeling');
  const recipes = listMaterialRecipes();
  const principles = listCompositionPrinciples();
  const principle = principles[0] as { name?: string } | undefined;

  const techniquesApplied: string[] = [];
  if (lighting) techniquesApplied.push(`technique:${lighting.name}`);
  if (modeling) techniquesApplied.push(`technique:${modeling.name}`);
  for (const r of recipes.slice(0, 2)) techniquesApplied.push(`material:${r.name}`);
  if (principle?.name) techniquesApplied.push(`composition:${principle.name}`);

  const seed = Math.abs([...cartridgeId].reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0), 0)) >>> 0;
  return {
    cartridge_id: cartridgeId,
    asset: 'cover_art',
    prompt: `hand-drawn key art, ${cartridgeId} protagonist in neon wasteland at dusk, cinematic composition, ` +
            `sun-bleached desert ruins, chrome and magenta neon, oversized exo-suit, painterly textures`,
    negative_prompt: 'photoreal skin, saturated greens, noon lighting, volumetric god-rays, photo-bash',
    references: [character.split('\n').slice(0, 8).join(' '), environment.split('\n').slice(0, 8).join(' ')],
    techniques_applied: techniquesApplied,
    seed,
  };
}

function manifestHash(p: PromptManifest): string {
  const payload = JSON.stringify({ p: p.prompt, n: p.negative_prompt, s: p.seed, t: p.techniques_applied });
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

async function maybeReplicate(prompt: PromptManifest): Promise<{ url: string } | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        version: process.env.ARTISAN_MODEL ?? '7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc', // sdxl
        input: { prompt: prompt.prompt, negative_prompt: prompt.negative_prompt, seed: prompt.seed },
      }),
    });
    if (!res.ok) return null;
    const json = await res.json() as { urls?: { get?: string } };
    return json.urls?.get ? { url: json.urls.get } : null;
  } catch { return null; }
}

async function main() {
  const cartridgeId = process.env.TARGET_CARTRIDGE ?? process.argv[2] ?? 'mad-maxi';
  const cover = buildPromptForCover(cartridgeId);
  const remote = await maybeReplicate(cover);
  const submittedTo = remote ? 'replicate' : 'none';
  const registryPath = recordAssetGeneration({
    cartridge_id: cartridgeId,
    asset: cover.asset,
    prompt_manifest_hash: manifestHash(cover),
    techniques_applied: cover.techniques_applied,
    submitted_to: submittedTo,
    output_url: remote?.url ?? null,
  });
  const result = {
    cartridge_id: cartridgeId,
    prompts: [cover],
    remote_submission: remote,
    remote_source: remote ? 'replicate' : 'none (no REPLICATE_API_TOKEN; prompts only)',
    asset_registry_entry: path.relative(process.cwd(), registryPath),
    generated_at: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(process.cwd(), '.gameengin-artisan-output.json'),
    JSON.stringify(result, null, 2),
  );
  logRDSession('artisan', `${cartridgeId}-cover`, result);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
