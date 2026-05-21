/**
 * scripts/gameengin/writer-run.ts
 *
 * Writer narrative agent. Spec: GameENGINspec.md §3.5, §5.4.
 *
 * Local work (always runs):
 *   - Reads existing `story/beats.json` (creates a default if missing).
 *   - Picks the next milestone slot and emits a structured beat scaffold
 *     anchored to the cartridge's emotional core.
 * Remote work (only when ANTHROPIC_API_KEY or OPENROUTER_API_KEY present):
 *   - Generates 2-3 sentences of voice-over text for the next beat.
 * TTS via ElevenLabs is *not* run here when ELEVENLABS_API_KEY is absent —
 * instead the text-only beat is recorded with `voice_pending: true`.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
    listDialoguePatterns,
    logRDSession,
    readCharacterVoice,
    readEmotionalTone,
    readNarrativePacing,
} from '../../lib/gameengin/brain-reader.js';

interface StoryBeat {
  id: string;
  trigger: string;
  emotion: string;
  text: string;
  voice_pending: boolean;
  generated_at: string;
}

interface StoryBeats { cartridge_id: string; beats: StoryBeat[] }

const DEFAULT_EMOTIONS = ['hopeful', 'weary', 'determined', 'reflective', 'fierce'];

async function maybeText(prompt: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY ?? process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const url = process.env.OPENROUTER_API_KEY
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.anthropic.com/v1/messages';
  const body = process.env.OPENROUTER_API_KEY
    ? { model: process.env.WRITER_MODEL ?? 'anthropic/claude-3.5-sonnet', messages: [{ role: 'user', content: prompt }] }
    : { model: process.env.WRITER_MODEL ?? 'claude-3-5-sonnet-latest', max_tokens: 200, messages: [{ role: 'user', content: prompt }] };
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (process.env.OPENROUTER_API_KEY) headers.authorization = `Bearer ${key}`;
  else { headers['x-api-key'] = key; headers['anthropic-version'] = '2023-06-01'; }
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) return null;
    const json = await res.json() as { content?: { text: string }[]; choices?: { message: { content: string } }[] };
    return json.content?.[0]?.text ?? json.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

async function main() {
  const cartridgeId = process.env.TARGET_CARTRIDGE ?? process.argv[2] ?? 'mad-maxi';
  const cartDir = path.join(process.cwd(), 'public', 'cartridges', cartridgeId);
  fs.mkdirSync(path.join(cartDir, 'story'), { recursive: true });
  const beatsPath = path.join(cartDir, 'story', 'beats.json');
  const beats: StoryBeats = fs.existsSync(beatsPath)
    ? JSON.parse(fs.readFileSync(beatsPath, 'utf-8'))
    : { cartridge_id: cartridgeId, beats: [] };

  const pacing = readNarrativePacing();
  const voice = readCharacterVoice(cartridgeId);
  const nextIdx = beats.beats.length;
  const emotion = pacing.tone_rotation[nextIdx % pacing.tone_rotation.length] ?? DEFAULT_EMOTIONS[nextIdx % DEFAULT_EMOTIONS.length];
  const tone = readEmotionalTone(emotion);
  const patterns = listDialoguePatterns();
  const triggerLevel = (nextIdx + 1) * pacing.beat_interval_levels;

  // Build a voice/tone-aware prompt the LLM (or human) can act on.
  const voiceLines = voice
    ? `Voice: ${voice.voice_summary}. Prefer: ${voice.vocabulary.preferred.join(', ')}. Avoid: ${voice.vocabulary.avoided.join(', ')}.`
    : `Voice: protagonist of "${cartridgeId}".`;
  const toneLines = tone
    ? `Tone "${tone.tone}": ${tone.definition} Lean: ${tone.vocabulary_lean.join(', ')}. Avoid: ${tone.vocabulary_avoid.join(', ')}.`
    : `Tone: ${emotion}.`;
  const prompt = `${voiceLines}\n${toneLines}\nWrite a 2-sentence voiceover beat. Max 22 words. No exclamation marks.`;

  const text = await maybeText(prompt);
  // Local fallback: synthesise a beat from the tone's example_lines, applied to character voice.
  const fallback = tone?.example_lines?.[nextIdx % (tone.example_lines.length || 1)] ?? null;

  const beat: StoryBeat = {
    id: `${cartridgeId}-beat-${nextIdx + 1}`,
    trigger: `level_complete_${triggerLevel}`,
    emotion,
    text: text ?? fallback ?? `[pending: no LLM key configured for "${cartridgeId}"]`,
    voice_pending: !process.env.ELEVENLABS_API_KEY,
    generated_at: new Date().toISOString(),
  };
  beats.beats.push(beat);
  fs.writeFileSync(beatsPath, JSON.stringify(beats, null, 2));

  const out = {
    cartridge_id: cartridgeId,
    added_beat: beat,
    total_beats: beats.beats.length,
    voice_loaded: voice !== null,
    tone_loaded: tone !== null,
    dialogue_patterns_available: patterns.length,
    pacing_version: pacing.version,
  };
  fs.writeFileSync(
    path.join(process.cwd(), '.gameengin-writer-output.json'),
    JSON.stringify(out, null, 2),
  );
  logRDSession('writer', `${cartridgeId}-beat`, out);
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
