/**
 * lib/audio-fingerprint/fingerprint.ts — §40 Fingerprint Record & Match
 */

import type { FrequencyPeak, PeakMap } from './peak-map';

export interface TimeSlice { startTimeSec: number; endTimeSec: number; similarityScore: number; }
export interface Fingerprint { id: string; startTime: number; endTime: number; peakMap: PeakMap; signature: number[]; }

function buildSignature(peaks: FrequencyPeak[], totalBins: number): number[] {
  const sig = new Array<number>(totalBins).fill(0);
  for (const p of peaks) { if (p.binIndex < totalBins) sig[p.binIndex] += p.magnitude; }
  const norm = Math.sqrt(sig.reduce((s, v: number) => s + v * v, 0)) || 1;
  return sig.map((v) => v / norm);
}

export function recordFingerprint(peakMap: PeakMap, startTime: number, endTime: number): Fingerprint {
  const relevant = peakMap.peaks.filter((p) => p.timeSec >= startTime && p.timeSec <= endTime);
  const totalBins = Math.floor(peakMap.fftSize / 2);
  return { id: `fp-${startTime}-${endTime}`, startTime, endTime, peakMap, signature: buildSignature(relevant, totalBins) };
}

export function matchFingerprint(fingerprint: Fingerprint, peakMap: PeakMap): TimeSlice[] {
  const windowSec = fingerprint.endTime - fingerprint.startTime;
  const totalBins = Math.floor(peakMap.fftSize / 2);
  const results: TimeSlice[] = [];
  const step = peakMap.sliceDuration * 5;
  for (let t = 0; t + windowSec <= peakMap.duration; t += step) {
    const windowPeaks = peakMap.peaks.filter((p) => p.timeSec >= t && p.timeSec < t + windowSec);
    const sig = buildSignature(windowPeaks, totalBins);
    const similarity = sig.reduce((s: string, v: number, i: number ) => s + v * (fingerprint.signature[i] ?? 0), 0);
    if (similarity > 0.6) results.push({ startTimeSec: t, endTimeSec: t + windowSec, similarityScore: similarity });
  }
  return results;
}