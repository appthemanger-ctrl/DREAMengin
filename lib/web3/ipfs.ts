/**
 * lib/web3/ipfs.ts
 *
 * IPFS content upload and retrieval — frontend adapter.
 *
 * Delegates all IPFS operations to the Express backend (backend/src/services/
 * ipfsService.js) via the Next.js proxy route `/api/social/ipfs/**` so that
 * IPFS credentials never touch the browser bundle.
 *
 * Public gateway fallback: when the backend is unreachable the module tries
 * to retrieve content directly from the configured public gateway, which is
 * read-only and doesn't require credentials.
 */

import { IpfsUploadResult, IpfsContent, Web3Error } from './types';

// ─── Config ───────────────────────────────────────────────────────────────────

const IPFS_API_BASE = '/api/social/ipfs';
const PUBLIC_GATEWAY =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? 'https://ipfs.io/ipfs';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cidToGatewayUrl(cid: string): string {
  return `${PUBLIC_GATEWAY}/${cid}`;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload arbitrary string content to IPFS via the backend proxy.
 *
 * @param content - UTF-8 string to pin
 * @returns CID, ipfs:// URI, gateway URL, and size in bytes
 */
export async function uploadToIpfs(content: string): Promise<IpfsUploadResult> {
  const res = await fetch(`${IPFS_API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Web3Error(
      body?.error ?? `IPFS upload failed (${res.status})`,
      'IPFS_ERROR'
    );
  }

  const data = (await res.json()) as { cid: string; size?: number };
  const cid = data.cid;

  return {
    cid,
    uri: `ipfs://${cid}`,
    gatewayUrl: cidToGatewayUrl(cid),
    size: data.size ?? new TextEncoder().encode(content).length,
  };
}

/**
 * Upload a File / Blob to IPFS via the backend proxy.
 * Useful for media uploads (images, audio, video).
 */
export async function uploadFileToIpfs(file: File): Promise<IpfsUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${IPFS_API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Web3Error(
      body?.error ?? `IPFS file upload failed (${res.status})`,
      'IPFS_ERROR'
    );
  }

  const data = (await res.json()) as { cid: string; size?: number };
  const cid = data.cid;

  return {
    cid,
    uri: `ipfs://${cid}`,
    gatewayUrl: cidToGatewayUrl(cid),
    size: data.size ?? file.size,
  };
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

/**
 * Retrieve content by CID.
 * Tries the backend proxy first; falls back to the public gateway.
 */
export async function getFromIpfs(cid: string): Promise<IpfsContent> {
  // Try backend proxy
  try {
    const res = await fetch(`${IPFS_API_BASE}/content/${encodeURIComponent(cid)}`);
    if (res.ok) {
      const data = (await res.json()) as { content: string; mimeType?: string };
      return {
        cid,
        content: data.content,
        mimeType: data.mimeType ?? null,
      };
    }
  } catch {
    // Backend unavailable — fall through to public gateway
  }

  // Public gateway fallback (read-only, no credentials required)
  const gatewayRes = await fetch(cidToGatewayUrl(cid));
  if (!gatewayRes.ok) {
    throw new Web3Error(
      `Failed to retrieve CID ${cid} from IPFS (${gatewayRes.status})`,
      'IPFS_ERROR'
    );
  }

  const content = await gatewayRes.text();
  const mimeType = gatewayRes.headers.get('content-type')?.split(';')[0] ?? null;

  return { cid, content, mimeType };
}

// ─── Pin ──────────────────────────────────────────────────────────────────────

/**
 * Pin a CID to prevent garbage collection.
 * Returns true if the pin succeeded, false if the backend was unreachable.
 * Never throws — callers should treat failed pins as a soft warning.
 */
export async function pinCid(cid: string): Promise<boolean> {
  try {
    const res = await fetch(`${IPFS_API_BASE}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cid }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

/**
 * Resolve an ipfs:// URI or bare CID to a public HTTP URL.
 * Useful for <img src> and <video src> when the browser can't speak IPFS natively.
 */
export function resolveIpfsUrl(cidOrUri: string): string {
  const cid = cidOrUri.startsWith('ipfs://')
    ? cidOrUri.slice('ipfs://'.length)
    : cidOrUri;
  return cidToGatewayUrl(cid);
}

/**
 * Return true if the string looks like an IPFS CID (v0 or v1) or ipfs:// URI.
 */
export function isIpfsCid(value: string): boolean {
  return (
    value.startsWith('ipfs://') ||
    /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(value) || // CIDv0
    /^baf[a-z2-7]{56}$/.test(value) // CIDv1 base32
  );
}
