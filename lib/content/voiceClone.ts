/**
 * voiceClone – ElevenLabs-style voice cloning and TTS client helpers.
 *
 * Calls the /api/content/voice-clone endpoint for:
 *   - Uploading a voice sample to create a cloned voice profile.
 *   - Generating speech from text using a cloned voice.
 *   - Listing / deleting saved voice profiles.
 *
 * Also provides a browser-native Web Speech API TTS fallback so the UI
 * remains functional without any backend credentials configured.
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
  /** True when result came from the browser Web Speech API fallback */
  isBrowserFallback?: boolean;
}

export interface ListVoiceProfilesResult {
  profiles: VoiceProfile[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Remote API helpers
// ─────────────────────────────────────────────────────────────────────────────

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

/** Fetch all voice profiles saved by the current user. */
export async function listVoiceProfiles(): Promise<ListVoiceProfilesResult> {
  const res = await fetch('/api/content/voice-clone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `List profiles failed (${res.status})`);
  }

  return res.json() as Promise<ListVoiceProfilesResult>;
}

/** Delete a saved voice profile by ID. */
export async function deleteVoiceProfile(voiceId: string): Promise<{ message: string }> {
  const res = await fetch('/api/content/voice-clone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', voiceId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Delete profile failed (${res.status})`);
  }

  return res.json() as Promise<{ message: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Browser-native Web Speech API fallback
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Speak text using the browser's built-in Web Speech API.
 *
 * Returns a Promise that resolves when the utterance ends.
 * This is a zero-credential fallback — no API key required.
 *
 * @param text      Text to speak.
 * @param voiceName Optional preferred voice name to look up in `speechSynthesis.getVoices()`.
 * @param rate      Speaking rate 0.5–2.0 (default 1.0).
 * @param pitch     Pitch 0–2 (default 1.0).
 */
export function speakWithBrowserTTS(
  text: string,
  voiceName?: string,
  rate = 1.0,
  pitch = 1.0
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject(new Error('Web Speech API is not available in this environment.'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.5, Math.min(2.0, rate));
    utterance.pitch = Math.max(0, Math.min(2.0, pitch));

    if (voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.name.toLowerCase().includes(voiceName.toLowerCase()));
      if (match) utterance.voice = match;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(new Error(`Speech synthesis error: ${e.error}`));

    window.speechSynthesis.cancel(); // cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
  });
}

/** Return the list of voices available via Web Speech API (browser only). */
export function getBrowserVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

// ─────────────────────────────────────────────────────────────────────────────
// File helpers
// ─────────────────────────────────────────────────────────────────────────────

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

/** Estimate TTS audio duration in seconds from word count. */
export function estimateDurationSeconds(text: string, wordsPerMinute = 150): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return wordCount / (wordsPerMinute / 60);
}

