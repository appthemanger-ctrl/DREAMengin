/**
 * scripts/gameengin/prophet-run.ts
 *
 * Prophet R&D agent. Spec: GameENGINspec.md §3.2, §4.
 *
 * Real local work performed every run:
 *   - Reads genre DNA from brain.
 *   - Reads mechanic-library catalogue.
 *   - Computes a candidate mechanic combo + originality signature.
 *   - Logs an R&D session to brain/rd-sessions/.
 *   - Writes `.gameengin-prophet-output.json` with proposed design rules.
 *
 * Optional remote work (only when ANTHROPIC_API_KEY or OPENROUTER_API_KEY is
 * set): synthesises a 1-paragraph design rationale via the configured LLM and
 * appends it to the output. No silent placeholder writes.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  readGenreDNA,
  listMechanics,
  signatureHash,
  isOriginal,
  logRDSession,
} from '../../lib/gameengin/brain-reader.js';

const DEFAULT_GENRE = 'platformer';
const DEFAULT_COMBO = ['coyote-time', 'double-jump', 'dash', 'parry'];

async function maybeLLMRationale(genre: string, combo: string[]): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY ?? process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const url = process.env.OPENROUTER_API_KEY
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.anthropic.com/v1/messages';
  try {
    const body = process.env.OPENROUTER_API_KEY
      ? {
          model: process.env.PROPHET_MODEL ?? 'anthropic/claude-3.5-sonnet',
          messages: [{
            role: 'user',
            content: `Genre: ${genre}\nMechanics: ${combo.join(', ')}\nIn 80 words, justify why this combination produces a "fun" platformer.`,
          }],
        }
      : {
          model: process.env.PROPHET_MODEL ?? 'claude-3-5-sonnet-latest',
          max_tokens: 220,
          messages: [{
            role: 'user',
            content: `Genre: ${genre}\nMechanics: ${combo.join(', ')}\nIn 80 words, justify why this combination produces a "fun" platformer.`,
          }],
        };
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (process.env.OPENROUTER_API_KEY) headers.authorization = `Bearer ${key}`;
    else { headers['x-api-key'] = key; headers['anthropic-version'] = '2023-06-01'; }
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) return null;
    const json = await res.json() as { content?: { text: string }[]; choices?: { message: { content: string } }[] };
    return json.content?.[0]?.text ?? json.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

async function main() {
  const cartridgeId = process.env.TARGET_CARTRIDGE ?? process.argv[2] ?? 'mad-maxi';
  const genre = process.env.TARGET_GENRE ?? DEFAULT_GENRE;
  const combo = (process.env.TARGET_COMBO?.split(',').map((s) => s.trim()) ?? DEFAULT_COMBO);

  const dna = readGenreDNA(genre);
  const mechanics = listMechanics();
  const sig = signatureHash(genre, combo);
  const original = isOriginal(sig);
  const rationale = await maybeLLMRationale(genre, combo);

  const designRules = {
    cartridge_id: cartridgeId,
    genre,
    emotional_core: dna.emotional_core,
    mechanic_combo: combo,
    signature_hash: sig,
    novel: original,
    referenced_mechanics: combo
      .map((id) => mechanics.find((m) => m.name.toLowerCase().replace(/\s+/g, '-') === id))
      .filter(Boolean),
    rationale,
    rationale_source: rationale
      ? (process.env.OPENROUTER_API_KEY ? 'openrouter' : 'anthropic')
      : 'none (no API key set; static design rules only)',
    generated_at: new Date().toISOString(),
  };

  const outPath = path.join(process.cwd(), '.gameengin-prophet-output.json');
  fs.writeFileSync(outPath, JSON.stringify(designRules, null, 2));
  logRDSession('prophet', `${genre}-${cartridgeId}`, designRules);
  console.log(JSON.stringify(designRules, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
