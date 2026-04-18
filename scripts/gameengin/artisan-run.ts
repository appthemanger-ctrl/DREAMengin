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

import { logRDSession, BRAIN_ROOT } from '../../lib/gameengin/brain-reader.js';

interface PromptManifest {
  cartridge_id: string;
  asset: 'cover_art' | 'environment_tileset' | 'character_sprite';
  prompt: string;
  negative_prompt: string;
  references: string[];
  seed: number;
}

function buildPromptForCover(cartridgeId: string): PromptManifest {
  const charPath = path.join(BRAIN_ROOT, 'visual-bible', 'characters', `${cartridgeId}.md`);
  const character = fs.existsSync(charPath) ? fs.readFileSync(charPath, 'utf-8') : '';
  const envPath = path.join(BRAIN_ROOT, 'visual-bible', 'environments', 'neon-wasteland.md');
  const environment = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const seed = Math.abs([...cartridgeId].reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0), 0)) >>> 0;
  return {
    cartridge_id: cartridgeId,
    asset: 'cover_art',
    prompt: `hand-drawn key art, ${cartridgeId} protagonist in neon wasteland at dusk, cinematic composition, ` +
            `sun-bleached desert ruins, chrome and magenta neon, oversized exo-suit, painterly textures`,
    negative_prompt: 'photoreal skin, saturated greens, noon lighting, volumetric god-rays, photo-bash',
    references: [character.split('\n').slice(0, 8).join(' '), environment.split('\n').slice(0, 8).join(' ')],
    seed,
  };
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
  const result = {
    cartridge_id: cartridgeId,
    prompts: [cover],
    remote_submission: remote,
    remote_source: remote ? 'replicate' : 'none (no REPLICATE_API_TOKEN; prompts only)',
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
