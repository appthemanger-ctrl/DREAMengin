/**
 * lib/audio-fingerprint/stem-extractor.ts — §40 Stem Extractor
 *
 * Stitches matching time-slices from a source AudioBuffer into a new
 * AudioBuffer containing only those segments, in order.
 *
 * Two modes:
 *   extractStem()      — synchronous copy-paste (no re-rendering).
 *                        Safe in all environments including SSR.  Returned
 *                        buffer may have tiny amplitude seams at splice points
 *                        but is correct for fingerprinting purposes.
 *
 *   extractStemAsync() — async OfflineAudioContext render (best quality).
 *                        Applies a 5 ms fade-in/out at each splice to remove
 *                        clicks.  Falls back to extractStem() when
 *                        OfflineAudioContext is unavailable (SSR / old browsers).
 */

import type { TimeSlice } from './fingerprint';

// ─── Synchronous (copy-paste, no Web Audio render) ────────────────────────────

/**
 * extractStem — synchronous slice stitcher.
 *
 * Copies PCM sample ranges from `audioBuffer` for each slice and
 * concatenates them into a fresh AudioBuffer.  No async required.
 */
export function extractStem(audioBuffer: AudioBuffer, slices: TimeSlice[]: AudioBuffer) {
  if (slices.length === 0) return audioBuffer;

  const { sampleRate, numberOfChannels } = audioBuffer;

  const totalSamples = slices.reduce(sum: Record<string, unknown>, sl: Record<string, unknown> => {
    const start = Math.max(0, Math.floor(sl.startTimeSec * sampleRate));
    const end   = Math.min(audioBuffer.length, Math.floor(sl.endTimeSec * sampleRate));
    return sum + Math.max(0, end - start);
  }, 0);

  const output = new AudioBuffer({
    numberOfChannels,
    length:     Math.max(totalSamples, 1),
    sampleRate,
  });

  let offset = 0;
  for (const sl of slices) {
    const startSample = Math.max(0, Math.floor(sl.startTimeSec * sampleRate));
    const endSample   = Math.min(audioBuffer.length, Math.floor(sl.endTimeSec * sampleRate));
    const len = Math.max(0, endSample - startSample);
    if (len === 0) continue;

    for (let ch = 0; ch < numberOfChannels; ch++) {
      const src = audioBuffer.getChannelData(ch).subarray(startSample, endSample);
      const dst = output.getChannelData(ch);
      const copyLen = Math.min(len, output.length - offset);
      if (copyLen > 0) dst.set(src.subarray(0, copyLen), offset);
    }
    offset += len;
  }

  return output;
}

// ─── Async (OfflineAudioContext render — best quality) ────────────────────────

const FADE_SAMPLES = 220; // ~5 ms at 44100 Hz

/**
 * extractStemAsync — async stem extractor with crossfade splices.
 *
 * Uses OfflineAudioContext to render the stitched buffer at full quality.
 * Each splice point gets a short linear fade-out / fade-in to eliminate
 * click artefacts.
 *
 * Falls back silently to the synchronous version when OfflineAudioContext is
 * unavailable (SSR, old browsers, unit-test environments).
 */
export async function extractStemAsync(
  audioBuffer: AudioBuffer,
  slices: TimeSlice[],
): Promise<AudioBuffer> {
  if (slices.length === 0) return audioBuffer;

  // SSR / environment guard
  if (typeof OfflineAudioContext === 'undefined') {
    return extractStem(audioBuffer, slices);
  }

  const { sampleRate, numberOfChannels } = audioBuffer;

  const totalSamples = slices.reduce(sum: Record<string, unknown>, sl: Record<string, unknown> => {
    const start = Math.max(0, Math.floor(sl.startTimeSec * sampleRate));
    const end   = Math.min(audioBuffer.length, Math.floor(sl.endTimeSec * sampleRate));
    return sum + Math.max(0, end - start);
  }, 0);

  if (totalSamples === 0) return audioBuffer;

  try {
    const ctx = new OfflineAudioContext(numberOfChannels, totalSamples, sampleRate);
    let destOffset = 0;

    for (const sl of slices) {
      const startSample = Math.max(0, Math.floor(sl.startTimeSec * sampleRate));
      const endSample   = Math.min(audioBuffer.length, Math.floor(sl.endTimeSec * sampleRate));
      const len = Math.max(0, endSample - startSample);
      if (len === 0) continue;

      // Slice the source into a mini AudioBuffer
      const sliceBuf = new AudioBuffer({ numberOfChannels, length: len, sampleRate });
      for (let ch = 0; ch < numberOfChannels; ch++) {
        const src = audioBuffer.getChannelData(ch).subarray(startSample, endSample);
        sliceBuf.getChannelData(ch).set(src);
      }

      // Apply fade-in at start, fade-out at end
      const fadeSamples = Math.min(FADE_SAMPLES, Math.floor(len / 4));
      for (let ch = 0; ch < numberOfChannels; ch++) {
        const data = sliceBuf.getChannelData(ch);
        for (let i = 0; i < fadeSamples; i++) {
          const t = i / fadeSamples;
          data[i] *= t;                         // fade-in
          data[len - 1 - i] *= t;              // fade-out
        }
      }

      const src = ctx.createBufferSource();
      src.buffer = sliceBuf;
      src.connect(ctx.destination);
      src.start(destOffset / sampleRate);

      destOffset += len;
    }

    return await ctx.startRendering();
  } catch {
    // OfflineAudioContext failed (quota, permission) — fall back
    return extractStem(audioBuffer, slices);
  }
}
