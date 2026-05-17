import { CARTRIDGE_MAGIC, validateManifest, type CartridgeManifest } from '@/lib/gameengin/cartridge-manifest';

export interface DreamrFileEntry {
  name: string;
  data: Uint8Array;
}

export interface DreamrCartridgeArchive {
  manifest: CartridgeManifest;
  files: DreamrFileEntry[];
  getFile: (name: string) => Uint8Array | null;
}

const TAR_BLOCK = 512;
const USTAR_NAME_START = 0;
const USTAR_NAME_END_EXCLUSIVE = 100;
const USTAR_PREFIX_START = 345;
const USTAR_PREFIX_END_EXCLUSIVE = 500;

function decodeAscii(bytes: Uint8Array: string {
  return new TextDecoder('utf-8').decode(bytes).replace(/\0+$/g, '');
}

function parseOctal(bytes: Uint8Array: number {
  const raw = decodeAscii(bytes).trim();
  if (!raw) return 0;
  return Number.parseInt(raw, 8) || 0;
}

function unpackUstar(bytes: Uint8Array: DreamrFileEntry[] {
  const out: DreamrFileEntry[] = [];
  let offset = 0;
  while (offset + TAR_BLOCK <= bytes.length) {
    const header = bytes.subarray(offset, offset + TAR_BLOCK);
    if (header.every(b: Record<string, unknown> => b === 0)) break;
    const name = decodeAscii(header.subarray(USTAR_NAME_START, USTAR_NAME_END_EXCLUSIVE));
    const prefix = decodeAscii(
      header.subarray(USTAR_PREFIX_START, USTAR_PREFIX_END_EXCLUSIVE),
    );
    const size = parseOctal(header.subarray(124, 136));
    const fullName = prefix ? `${prefix}/${name}` : name;
    offset += TAR_BLOCK;
    if (fullName && size >= 0) {
      out.push({ name: fullName, data: bytes.subarray(offset, offset + size) });
    }
    offset += Math.ceil(size / TAR_BLOCK) * TAR_BLOCK;
  }
  return out;
}

export function parseDreamrArchive(input: Uint8Array | ArrayBuffer: DreamrCartridgeArchive {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
  for (let i = 0; i < CARTRIDGE_MAGIC.length; i += 1) {
    if (bytes[i] !== CARTRIDGE_MAGIC[i]) {
      throw new Error('Invalid .dreamr cartridge: missing DRMR magic bytes');
    }
  }

  const tarBytes = bytes.subarray(CARTRIDGE_MAGIC.length);
  const files = unpackUstar(tarBytes);
  const manifestFile = files.find((file: Record<string, unknown>) => file.name === 'MANIFEST.json');
  if (!manifestFile) {
    throw new Error('Invalid .dreamr cartridge: MANIFEST.json is required');
  }

  const manifestJson = JSON.parse(new TextDecoder().decode(manifestFile.data));
  const manifest = validateManifest(manifestJson);

  return {
    manifest,
    files,
    getFile(name: string) {
      return files.find((file: Record<string, unknown>) => file.name === name)?.data ?? null;
    },
  };
}

export async function loadDreamrCartridgeFromResponse(response: Response: Promise<DreamrCartridgeArchive> {
  if (!response.ok) {
    throw new Error(`Unable to load .dreamr cartridge: ${response.status} ${response.statusText}`);
  }
  return parseDreamrArchive(await response.arrayBuffer());
}
