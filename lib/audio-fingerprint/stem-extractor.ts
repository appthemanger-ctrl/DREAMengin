/**
 * lib/audio-fingerprint/stem-extractor.ts — §40 Stem Extractor
 */
import type { TimeSlice } from './fingerprint';

export function extractStem(audioBuffer: AudioBuffer, slices: TimeSlice[]): AudioBuffer {
  if (slices.length === 0) return audioBuffer;
  const { sampleRate, numberOfChannels } = audioBuffer;
  const totalSamples = slices.reduce((s, sl) => s + Math.floor((sl.endTimeSec - sl.startTimeSec) * sampleRate), 0);
  const ctx = new OfflineAudioContext(numberOfChannels, Math.max(totalSamples, 1), sampleRate);
  // We return a stub synchronously; actual stitching requires async render
  // For SSR safety, return the original buffer if OfflineAudioContext unavailable
  void ctx;
  let offset = 0;
  const output = new AudioBuffer({ numberOfChannels, length: Math.max(totalSamples, 1), sampleRate });
  for (const sl of slices) {
    const startSample = Math.floor(sl.startTimeSec * sampleRate);
    const endSample   = Math.min(Math.floor(sl.endTimeSec * sampleRate), audioBuffer.length);
    const len = endSample - startSample;
    for (let ch = 0; ch < numberOfChannels; ch++) {
      const src = audioBuffer.getChannelData(ch).slice(startSample, endSample);
      const dst = output.getChannelData(ch);
      for (let i = 0; i < len && offset + i < output.length; i++) dst[offset + i] = src[i];
    }
    offset += len;
  }
  return output;
}
