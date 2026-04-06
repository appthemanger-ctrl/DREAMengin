import { describe, expect, it } from 'vitest';
import {
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
});
