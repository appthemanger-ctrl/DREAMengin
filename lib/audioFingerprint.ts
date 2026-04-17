/**
 * Audio Fingerprint — Fingerprint-Based Sound Isolation
 *
 * Builds constellation peak-maps from AudioBuffers, records reference
 * fingerprints, matches them against a live signal, and extracts
 * isolated audio stems.
 *
 * Torridity constants (n=2.1, ΔP=0.1) are used to filter low-energy
 * peaks below a dynamic threshold.
 */

import { TORRIDITY_N, TORRIDITY_DP } from './torridity';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single frequency peak. */
export interface Peak {
  /** Frequency bin index. */
  binIndex: number;
  /** Approximate frequency in Hz (binIndex * sampleRate / fftSize). */
  frequencyHz: number;
  /** Peak magnitude (linear). */
  magnitude: number;
  /** Time slice index. */
  timeSlice: number;
}

/**
 * PeakMap: sparse constellation of the top-K peaks per time slice.
 * Designed to be ~200 KB for a 3-minute song at default settings.
 */
export interface PeakMap {
  songId?: string;
  /** FFT size used during analysis. */
  fftSize: number;
  /** Sample rate of the source audio. */
  sampleRate: number;
  /** Duration of each time slice in seconds. */
  sliceDurationSec: number;
  /** All peaks across all time slices. */
  peaks: Peak[];
  /** Total number of time slices. */
  totalSlices: number;
}

/** A reference fingerprint anchored to a specific time window. */
export interface Fingerprint {
  id: string;
  startTime: number;   // seconds
  endTime: number;     // seconds
  peakMap: PeakMap;
  /** Normalised signature vector for fast cosine matching. */
  signature: number[];
}

export interface MatchResult {
  timeSlice: number;
  startTimeSec: number;
  endTimeSec: number;
  similarityScore: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FFT_SIZE        = 2048;
const DEFAULT_SLICE_DURATION  = 0.1;   // 100 ms per slice
const DEFAULT_TOP_K           = 5;

/**
 * Peak-energy threshold derived from torridity:
 *   threshold = ΔP * n   (0.1 * 2.1 = 0.21 of max magnitude)
 */
const PEAK_THRESHOLD_FRACTION = TORRIDITY_DP * TORRIDITY_N; // 0.21

// ─── buildPeakMap ─────────────────────────────────────────────────────────────

/**
 * buildPeakMap(audioBuffer, topK)
 *
 * Analyses an AudioBuffer by time-slicing and running a simple FFT
 * approximation to extract the topK frequency peaks per slice.
 *
 * NOTE: Full FFT requires OfflineAudioContext which is browser-only.
 * We use a DFT-based approach here that works in both browser and
 * server environments (for testing).
 */
export function buildPeakMap(audioBuffer: AudioBuffer, topK = DEFAULT_TOP_K): PeakMap {
  const sampleRate      = audioBuffer.sampleRate;
  const fftSize         = DEFAULT_FFT_SIZE;
  const sliceSamples    = Math.floor(sampleRate * DEFAULT_SLICE_DURATION);
  const channelData     = audioBuffer.getChannelData(0); // mono
  const totalSlices     = Math.floor(channelData.length / sliceSamples);
  const peaks: Peak[]   = [];

  const maxMagnitude    = 1.0; // linear scale
  const energyThreshold = maxMagnitude * PEAK_THRESHOLD_FRACTION;

  for (let slice = 0; slice < totalSlices; slice++) {
    const offset   = slice * sliceSamples;
    const window   = channelData.slice(offset, offset + sliceSamples);

    // Simple magnitude spectrum via DFT (only up to fftSize/2 bins)
    const halfBins = Math.min(fftSize / 2, sliceSamples / 2);
    const magnitudes: { bin: number; mag: number }[] = [];

    for (let bin = 1; bin < halfBins; bin++) {
      let re = 0, im = 0;
      const twoPiBinOverN = (2 * Math.PI * bin) / sliceSamples;
      for (let i = 0; i < sliceSamples; i++) {
        re += (window[i] ?? 0) * Math.cos(twoPiBinOverN * i);
        im += (window[i] ?? 0) * Math.sin(twoPiBinOverN * i);
      }
      const mag = Math.sqrt(re * re + im * im) / sliceSamples;
      if (mag >= energyThreshold) {
        magnitudes.push({ bin, mag });
      }
    }

    // Sort descending by magnitude and take topK
    magnitudes.sort((a, b) => b.mag - a.mag);
    for (let k = 0; k < Math.min(topK, magnitudes.length); k++) {
      const { bin, mag } = magnitudes[k];
      peaks.push({
        binIndex:     bin,
        frequencyHz:  (bin * sampleRate) / fftSize,
        magnitude:    mag,
        timeSlice:    slice,
      });
    }
  }

  return {
    fftSize,
    sampleRate,
    sliceDurationSec: DEFAULT_SLICE_DURATION,
    peaks,
    totalSlices,
  };
}

// ─── Fingerprint helpers ──────────────────────────────────────────────────────

function peaksInWindow(peakMap: PeakMap, startSec: number, endSec: number): Peak[] {
  const startSlice = Math.floor(startSec / peakMap.sliceDurationSec);
  const endSlice   = Math.ceil(endSec / peakMap.sliceDurationSec);
  return peakMap.peaks.filter(
    (p) => p.timeSlice >= startSlice && p.timeSlice < endSlice
  );
}

function buildSignature(peaks: Peak[], fftSize: number): number[] {
  const halfBins = fftSize / 2;
  const vec      = new Array<number>(halfBins).fill(0);
  for (const p of peaks) {
    if (p.binIndex < halfBins) {
      vec[p.binIndex] = Math.max(vec[p.binIndex], p.magnitude);
    }
  }
  // Normalise to unit length
  const norm = Math.sqrt(vec.reduce((a, v) => a + v * v, 0));
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}

// ─── recordReferenceFingerprint ──────────────────────────────────────────────

/**
 * recordReferenceFingerprint(peakMap, startTime, endTime)
 *
 * Extracts peaks from the specified time window and builds a
 * normalised signature vector for fast matching.
 */
export function recordReferenceFingerprint(
  peakMap: PeakMap,
  startTime: number,
  endTime: number
): Fingerprint {
  const windowPeaks = peaksInWindow(peakMap, startTime, endTime);
  const signature   = buildSignature(windowPeaks, peakMap.fftSize);
  const id          = `fp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return { id, startTime, endTime, peakMap: { ...peakMap, peaks: windowPeaks }, signature };
}

// ─── matchFingerprint ────────────────────────────────────────────────────────

/**
 * matchFingerprint(fingerprint, candidatePeakMap, threshold)
 *
 * Slides the fingerprint signature over each time slice in
 * candidatePeakMap, returning slices whose cosine similarity
 * exceeds the threshold.
 */
export function matchFingerprint(
  fingerprint: Fingerprint,
  candidatePeakMap: PeakMap,
  threshold = 0.8
): MatchResult[] {
  const results: MatchResult[] = [];
  const fpDuration = fingerprint.endTime - fingerprint.startTime;
  const fpSlices   = Math.ceil(fpDuration / candidatePeakMap.sliceDurationSec);

  for (let slice = 0; slice <= candidatePeakMap.totalSlices - fpSlices; slice++) {
    const startSec   = slice * candidatePeakMap.sliceDurationSec;
    const endSec     = startSec + fpDuration;
    const windowPeaks = peaksInWindow(candidatePeakMap, startSec, endSec);
    const candidateSig = buildSignature(windowPeaks, candidatePeakMap.fftSize);

    // Cosine similarity
    let dot = 0;
    const len = Math.min(fingerprint.signature.length, candidateSig.length);
    for (let i = 0; i < len; i++) dot += fingerprint.signature[i] * candidateSig[i];

    if (dot >= threshold) {
      results.push({ timeSlice: slice, startTimeSec: startSec, endTimeSec: endSec, similarityScore: dot });
    }
  }

  return results;
}

// ─── createFingerprintIsolator ───────────────────────────────────────────────

/**
 * createFingerprintIsolator()
 *
 * Returns a stateful isolator object that lets the user:
 *   1. Record a reference fingerprint from a visual tap (recordReference).
 *   2. Match that fingerprint against the full song peak map and extract
 *      isolated audio chunks (isolate).
 *
 * Uses constellation peak-map technique described in docs/LAW.md §17.
 * No AI model required — pure signal fingerprinting.
 */
export function createFingerprintIsolator() {
  let _reference: Fingerprint | null = null;

  return {
    /** True once a reference fingerprint has been recorded. */
    get hasReference() {
      return _reference !== null;
    },

    /**
     * Record a reference fingerprint from a time window in the peak map.
     * Typically called when the user taps a frequency hotspot in the 3D
     * visualizer.
     */
    recordReference(peakMap: PeakMap, startTime: number, endTime: number): Fingerprint {
      _reference = recordReferenceFingerprint(peakMap, startTime, endTime);
      return _reference;
    },

    /**
     * Match the reference fingerprint against candidatePeakMap and extract
     * matching audio chunks from sourceBuffer as an isolated stem AudioBuffer.
     *
     * Returns null if no reference fingerprint has been recorded.
     */
    isolate(
      candidatePeakMap: PeakMap,
      sourceBuffer: AudioBuffer,
      threshold = 0.75,
    ): AudioBuffer | null {
      if (!_reference) return null;
      const matches = matchFingerprint(_reference, candidatePeakMap, threshold);
      return extractAudioChunks(sourceBuffer, matches);
    },

    /** Clear the stored reference fingerprint. */
    clear() {
      _reference = null;
    },
  };
}

// ─── extractAudioChunks ──────────────────────────────────────────────────────

/**
 * extractAudioChunks(audioBuffer, timeSlices)
 *
 * Stitches the matched time slices from the source AudioBuffer into a
 * new AudioBuffer (isolated stem).
 *
 * Requires browser AudioContext.
 */
export function extractAudioChunks(
  audioBuffer: AudioBuffer,
  timeSlices: MatchResult[]
): AudioBuffer {
  if (timeSlices.length === 0) {
    // Return a 1-sample silent buffer
    const ctx   = new AudioContext();
    const empty = ctx.createBuffer(audioBuffer.numberOfChannels, 1, audioBuffer.sampleRate);
    return empty;
  }

  const sampleRate   = audioBuffer.sampleRate;
  const numChannels  = audioBuffer.numberOfChannels;
  const ctx          = new AudioContext();

  // Total sample count needed
  const totalSamples = timeSlices.reduce(
    (acc, s) => acc + Math.floor((s.endTimeSec - s.startTimeSec) * sampleRate),
    0
  );

  const output = ctx.createBuffer(numChannels, totalSamples, sampleRate);

  let writeOffset = 0;
  for (const slice of timeSlices) {
    const startSample = Math.floor(slice.startTimeSec * sampleRate);
    const endSample   = Math.min(
      Math.floor(slice.endTimeSec * sampleRate),
      audioBuffer.length
    );
    const chunkLength = endSample - startSample;

    for (let ch = 0; ch < numChannels; ch++) {
      const srcData  = audioBuffer.getChannelData(ch);
      const dstData  = output.getChannelData(ch);
      for (let i = 0; i < chunkLength; i++) {
        dstData[writeOffset + i] = srcData[startSample + i] ?? 0;
      }
    }
    writeOffset += chunkLength;
  }

  return output;
}
