import { GCTEngine, Template, type GCTMatch } from './gct-engine';

export interface SongFingerprint {
  id: string;
  fingerprint: Float32Array;
}

/**
 * Lightweight feature extraction placeholder.
 * Swap this with FFT/spectrogram features for production use.
 */
export function audioToVector(audioBuffer: Float32Array, _sampleRate: number): Float32Array {
  const clipLength = Math.min(audioBuffer.length, 10_000);
  return audioBuffer.slice(0, clipLength);
}

export async function identifySong(
  clip: Float32Array,
  songDatabase: SongFingerprint[],
  sampleRate: number,
  threshold = 0.9
): Promise<GCTMatch | null> {
  if (songDatabase.length === 0) return null;

  const engine = new GCTEngine({ preferGPU: true, numTemplates: songDatabase.length });
  await engine.init();

  const query = audioToVector(clip, sampleRate);
  const templates: Template[] = songDatabase.map((song) => ({
    id: song.id,
    data: song.fingerprint,
  }));

  const matches = await engine.search(query, templates, threshold);
  matches.sort((a, b) => b.correlation - a.correlation);
  return matches[0] ?? null;
}
