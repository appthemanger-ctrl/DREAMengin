/**
 * lib/audio-fingerprint/index.ts — §40 Audio Fingerprint
 */
export { buildPeakMap, type PeakMap, type FrequencyPeak } from './peak-map';
export { recordFingerprint, matchFingerprint, type Fingerprint, type TimeSlice } from './fingerprint';
export { extractStem } from './stem-extractor';
