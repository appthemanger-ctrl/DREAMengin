/**
 * voiceClone – ElevenLabs-style voice cloning and TTS client helpers.
 *
 * Calls the /api/content/voice-clone endpoint for:
 *   - Uploading a voice sample to create a cloned voice profile.
 *   - Generating speech from text using a cloned voice.
 */

export interface VoiceProfile {
  id: string;
  name: string;
  /** ISO datetime of when the profile was created */
  createdAt: string;
}

export interface VoiceCloneRequest {
  /** Base64-encoded audio sample (WAV/MP3, ≈30s) */
  sampleBase64: string;
  /** Friendly name for the cloned voice */
  voiceName: string;
}

export interface VoiceCloneResult {
  profile: VoiceProfile;
  message: string;
}

export interface TTSRequest {
  /** Text to synthesise */
  text: string;
  /** ID of a previously cloned voice */
  voiceId: string;
  /** Stability (0–1, default 0.5) */
  stability?: number;
  /** Similarity boost (0–1, default 0.75) */
  similarityBoost?: number;
}

export interface TTSResult {
  /** Base64-encoded audio output (MP3) */
  audioBase64: string;
  /** Duration in seconds (approximate) */
  durationSeconds: number;
  voiceId: string;
}

export async function cloneVoice(req: VoiceCloneRequest): Promise<VoiceCloneResult> {
  const res = await fetch('/api/content/voice-clone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clone', ...req }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Voice clone failed (${res.status})`);
  }

  return res.json() as Promise<VoiceCloneResult>;
}

export async function textToSpeech(req: TTSRequest): Promise<TTSResult> {
  const res = await fetch('/api/content/voice-clone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'tts', ...req }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `TTS failed (${res.status})`);
  }

  return res.json() as Promise<TTSResult>;
}

/** Convert an audio File to base64 (browser only). */
export function audioFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? result);
    };
    reader.onerror = () => reject(new Error('Failed to read audio file'));
    reader.readAsDataURL(file);
  });
}
