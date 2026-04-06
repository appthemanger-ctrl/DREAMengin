import { describe, expect, it } from 'vitest';
import {
  analyzeLedgerDensity,
  buildLedgerMediaUrl,
  decodeFromLedger,
  decodeLedgerBlob,
  decodeLedgerStringToUint8Array,
  encodeBlobToLedger,
  encodeToLedger,
  encodeUint8ArrayToLedgerString,
} from '@/lib/media/ledger';

describe('ledger media helpers', () => {
  it('round-trips numeric ledger values', () => {
    const values = [0, 1, 2, 32, 128, 255];
    const encoded = encodeToLedger(values);
    const decoded = decodeFromLedger(encoded).map((value) => Math.round(value));

    expect(decoded).toEqual(values);
  });

  it('round-trips a DB ledger payload', () => {
    const bytes = Uint8Array.from([0, 11, 64, 128, 255]);
    const encoded = encodeUint8ArrayToLedgerString(bytes, {
      mimeType: 'application/octet-stream',
      fileName: 'mesh.bin',
    });
    const payload = JSON.parse(encoded) as {
      blackHoleThrottleApplied: boolean;
      signalCount: number;
      signalRatio: number;
      throttleChunkSize: number;
    };

    expect(payload.blackHoleThrottleApplied).toBe(true);
    expect(payload.signalCount).toBeGreaterThan(0);
    expect(payload.signalRatio).toBeGreaterThanOrEqual(0.1);
    expect(payload.throttleChunkSize).toBeGreaterThan(0);
    expect(Array.from(decodeLedgerStringToUint8Array(encoded))).toEqual(Array.from(bytes));
  });

  it('round-trips a binary ledger blob', async () => {
    const original = new Blob([Uint8Array.from([1, 5, 9, 13, 255])], { type: 'audio/wav' });
    const encoded = await encodeBlobToLedger(original, { fileName: 'clip.wav' });
    const decoded = await decodeLedgerBlob(encoded);

    expect(decoded.type).toBe('audio/wav');
    expect(Array.from(new Uint8Array(await decoded.arrayBuffer()))).toEqual([1, 5, 9, 13, 255]);
  });

  it('builds the decode route URL', () => {
    expect(buildLedgerMediaUrl('audio', 'user-1/starmaker/clip.wav.ledger')).toBe(
      '/api/ledger-media?bucket=audio&path=user-1%2Fstarmaker%2Fclip.wav.ledger',
    );
  });

  it('URL-encodes special characters in ledger media paths', () => {
    expect(buildLedgerMediaUrl('audio', 'user 1/starmaker/clip & mix?.wav.ledger')).toBe(
      '/api/ledger-media?bucket=audio&path=user%201%2Fstarmaker%2Fclip%20%26%20mix%3F.wav.ledger',
    );
  });

  it('flags black-hole density spikes using the n=2.1 profile', () => {
    const denseProfile = analyzeLedgerDensity(encodeToLedger([0, 1, 16, 64, 128, 255]));

    expect(denseProfile.blackHoleThrottleApplied).toBe(true);
    expect(denseProfile.signalRatio).toBeGreaterThanOrEqual(0.1);
    expect(denseProfile.throttleChunkSize).toBeGreaterThan(0);
  });
});
