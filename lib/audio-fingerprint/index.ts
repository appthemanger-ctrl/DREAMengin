/**
 * lib/audio-fingerprint/index.ts — §40 Audio Fingerprint
 */
export { matchFingerprint, recordFingerprint, type Fingerprint, type TimeSlice } from './fingerprint';
export { buildPeakMap, type FrequencyPeak, type PeakMap } from './peak-map';
export { extractStem } from './stem-extractor';
