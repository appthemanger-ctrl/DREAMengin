const DATA_PHYSICS = {
  n: 2.1,
  a0: 1.2e-10,
  participation: 0.1,
} as const;

const LEDGER_MAGIC = 'DELEDGER1';
const NEWLINE_BYTE = 10;

export interface LedgerBinaryHeader {
  version: 1;
  mimeType: string;
  originalSize: number;
  fileName?: string;
}

export interface LedgerDbPayload extends LedgerBinaryHeader {
  encodedBase64: string;
}

export interface LedgerUploadResult {
  bucket: string;
  storagePath: string;
  mediaUrl: string;
  mimeType: string;
  originalSize: number;
}

type StorageUploadClient = {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        fileBody: Blob,
        options?: { cacheControl?: string; upsert?: boolean; contentType?: string },
      ) => Promise<{ error: { message: string } | null }>;
      download: (path: string) => Promise<{ data: Blob | null; error: { message: string } | null }>;
    };
  };
};

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(value, 'base64'));
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function floatsToBuffer(values: number[]): ArrayBuffer {
  return new Float32Array(values).buffer.slice(0);
}

function bytesToFloats(bytes: Uint8Array): number[] {
  const aligned = bytes.byteOffset % 4 === 0
    ? new Float32Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4))
    : new Float32Array(bytes.slice().buffer);
  return Array.from(aligned);
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function findNewline(bytes: Uint8Array, start = 0): number {
  for (let i = start; i < bytes.length; i += 1) {
    if (bytes[i] === NEWLINE_BYTE) return i;
  }
  return -1;
}

function parseLedgerBinary(bytes: Uint8Array): { header: LedgerBinaryHeader; payload: Uint8Array } {
  const firstNewline = findNewline(bytes);
  const secondNewline = firstNewline >= 0 ? findNewline(bytes, firstNewline + 1) : -1;

  if (firstNewline < 0 || secondNewline < 0) {
    throw new Error('Invalid ledger payload');
  }

  const decoder = new TextDecoder();
  const magic = decoder.decode(bytes.subarray(0, firstNewline));
  if (magic !== LEDGER_MAGIC) {
    throw new Error('Unsupported ledger payload');
  }

  const header = JSON.parse(decoder.decode(bytes.subarray(firstNewline + 1, secondNewline))) as LedgerBinaryHeader;
  return {
    header,
    payload: bytes.subarray(secondNewline + 1),
  };
}

export function encodeToLedger(buffer: number[]): number[] {
  return buffer.map((val) => Math.sign(val) * Math.log(1 + Math.abs(val)));
}

export function compressData(encodedBuffer: number[]): number[] {
  return encodedBuffer.filter((dataPoint) => {
    const x = Math.abs(dataPoint) / DATA_PHYSICS.a0;
    const expected = x / Math.pow(1 + Math.pow(x, DATA_PHYSICS.n), 1 / DATA_PHYSICS.n);
    return Math.abs(dataPoint - expected) > (DATA_PHYSICS.participation * 0.01);
  });
}

export function decodeFromLedger(buffer: number[]): number[] {
  return buffer.map((val) => Math.sign(val) * (Math.exp(Math.abs(val)) - 1));
}

export function buildLedgerMediaUrl(bucket: string, storagePath: string): string {
  return `/api/ledger-media?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(storagePath)}`;
}

export function encodeUint8ArrayToLedgerString(
  bytes: Uint8Array,
  options: Pick<LedgerBinaryHeader, 'mimeType' | 'fileName'>,
): string {
  const payload: LedgerDbPayload = {
    version: 1,
    mimeType: options.mimeType,
    fileName: options.fileName,
    originalSize: bytes.byteLength,
    encodedBase64: bytesToBase64(new Uint8Array(floatsToBuffer(encodeToLedger(Array.from(bytes))))),
  };
  return JSON.stringify(payload);
}

export function decodeLedgerStringToUint8Array(serialized: string): Uint8Array {
  const payload = JSON.parse(serialized) as LedgerDbPayload;
  const decoded = decodeFromLedger(bytesToFloats(base64ToBytes(payload.encodedBase64)));
  return Uint8Array.from(decoded.slice(0, payload.originalSize).map(clampByte));
}

export async function encodeBlobToLedger(blob: Blob, options?: { fileName?: string; mimeType?: string }): Promise<Blob> {
  const header: LedgerBinaryHeader = {
    version: 1,
    mimeType: options?.mimeType || blob.type || 'application/octet-stream',
    originalSize: blob.size,
    fileName: options?.fileName,
  };
  const source = new Uint8Array(await blob.arrayBuffer());
  const headerText = `${LEDGER_MAGIC}\n${JSON.stringify(header)}\n`;
  return new Blob(
    [headerText, floatsToBuffer(encodeToLedger(Array.from(source)))],
    { type: 'application/octet-stream' },
  );
}

export async function decodeLedgerBlob(blob: Blob): Promise<Blob> {
  const { header, payload } = parseLedgerBinary(new Uint8Array(await blob.arrayBuffer()));
  const decoded = decodeFromLedger(bytesToFloats(payload));
  return new Blob(
    [Uint8Array.from(decoded.slice(0, header.originalSize).map(clampByte))],
    { type: header.mimeType || 'application/octet-stream' },
  );
}

export async function uploadBlobToLedgerStorage(
  supabase: StorageUploadClient,
  options: {
    bucket: string;
    storagePath: string;
    blob: Blob;
    fileName?: string;
    mimeType?: string;
    cacheControl?: string;
    upsert?: boolean;
  },
): Promise<LedgerUploadResult> {
  const encodedBlob = await encodeBlobToLedger(options.blob, {
    fileName: options.fileName,
    mimeType: options.mimeType,
  });

  const { error } = await supabase.storage
    .from(options.bucket)
    .upload(options.storagePath, encodedBlob, {
      cacheControl: options.cacheControl ?? '3600',
      upsert: options.upsert ?? false,
      contentType: 'application/octet-stream',
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    bucket: options.bucket,
    storagePath: options.storagePath,
    mediaUrl: buildLedgerMediaUrl(options.bucket, options.storagePath),
    mimeType: options.mimeType || options.blob.type || 'application/octet-stream',
    originalSize: options.blob.size,
  };
}

export async function downloadBlobFromLedgerStorage(
  supabase: StorageUploadClient,
  bucket: string,
  storagePath: string,
): Promise<Blob> {
  const { data, error } = await supabase.storage.from(bucket).download(storagePath);
  if (error || !data) {
    throw new Error(error?.message || 'Unable to download ledger media');
  }
  return decodeLedgerBlob(data);
}
