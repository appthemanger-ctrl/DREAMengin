/**
 * scripts/gameengin/package-cartridge.ts
 *
 * Build a `.dreamr` cartridge from a directory.
 * Spec: GameENGINspec.md §1.1, §5.5.
 *
 *   pnpm tsx scripts/gameengin/package-cartridge.ts <cartridge-dir> [--out <file>]
 *
 * Layout of the produced file (decompressed view):
 *   [magic "DRMR" 4 bytes] [POSIX ustar TAR archive]
 *
 * Compression: zstd level 19 when the system `zstd` binary is available
 * (spec-preferred); otherwise gzip level 9 fallback so the script never
 * silently fails in environments without zstd. The chosen codec is recorded
 * inside the produced filename suffix (`.dreamr` always; an adjacent
 * `.dreamr.codec` file records `zstd` or `gzip`).
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { gzipSync } from 'node:zlib';

import { packTar, type TarFile } from './lib/tar.js';
import { CARTRIDGE_MAGIC, validateManifest } from '../../lib/gameengin/cartridge-manifest.js';

function walk(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else if (entry.isFile()) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

function hasZstd(): boolean {
  try { execFileSync('zstd', ['--version'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

function compress(payload: Uint8Array): { data: Uint8Array; codec: 'zstd' | 'gzip' } {
  if (hasZstd()) {
    const tmp = path.join(process.cwd(), `.cart-tmp-${process.pid}.bin`);
    const tmpOut = `${tmp}.zst`;
    try {
      fs.writeFileSync(tmp, payload);
      execFileSync('zstd', ['-19', '-q', '-f', '-o', tmpOut, tmp], { stdio: 'inherit' });
      const data = new Uint8Array(fs.readFileSync(tmpOut));
      return { data, codec: 'zstd' };
    } finally {
      try { fs.unlinkSync(tmp); } catch {}
      try { fs.unlinkSync(tmpOut); } catch {}
    }
  }
  return { data: new Uint8Array(gzipSync(payload, { level: 9 })), codec: 'gzip' };
}

export interface PackResult {
  cartridgeId: string;
  outFile: string;
  bytes: number;
  codec: 'zstd' | 'gzip';
  fileCount: number;
}

export function packageCartridge(cartridgeDir: string, outFile?: string): PackResult {
  const abs = path.resolve(cartridgeDir);
  if (!fs.existsSync(abs)) throw new Error(`cartridge dir not found: ${abs}`);
  const manifestPath = path.join(abs, 'MANIFEST.json');
  if (!fs.existsSync(manifestPath)) throw new Error(`MANIFEST.json missing in ${abs}`);

  const manifestRaw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const manifest = validateManifest(manifestRaw);

  const rels = walk(abs).sort();
  const files: TarFile[] = rels.map((rel) => ({
    name: rel,
    data: new Uint8Array(fs.readFileSync(path.join(abs, rel))),
  }));

  const tar = packTar(files);
  const payload = new Uint8Array(CARTRIDGE_MAGIC.length + tar.length);
  payload.set(CARTRIDGE_MAGIC, 0);
  payload.set(tar, CARTRIDGE_MAGIC.length);

  const { data, codec } = compress(payload);
  const out = outFile ?? path.join(abs, `..`, `${manifest.cartridge_id}.dreamr`);
  fs.writeFileSync(out, data);
  fs.writeFileSync(`${out}.codec`, codec, 'utf-8');

  return { cartridgeId: manifest.cartridge_id, outFile: out, bytes: data.length, codec, fileCount: files.length };
}

// --- CLI ---------------------------------------------------------------------
function isMain(): boolean {
  return import.meta.url === `file://${process.argv[1]}` ||
         import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;
}

if (isMain()) {
  const args = process.argv.slice(2);
  const dir = args[0];
  const outIdx = args.indexOf('--out');
  const out = outIdx >= 0 ? args[outIdx + 1] : undefined;
  if (!dir) {
    console.error('usage: package-cartridge <dir> [--out <file>]');
    process.exit(2);
  }
  const r = packageCartridge(dir, out);
  console.log(JSON.stringify(r, null, 2));
}
