/**
 * lib/connectors/providers/nostr.ts
 *
 * Phase 5 — Nostr provider (Tier 1)
 *
 * Required credentials (stored in connector_accounts.token_blob):
 *   { pubkey: string, relays: string[] }
 *
 * pubkey is the user's Nostr public key in hex or npub format.
 * relays is a list of WebSocket relay URLs (e.g. wss://relay.damus.io).
 *
 * No environment variables required — user provides their own key + relays.
 *
 * Implementation note: Nostr uses WebSockets (the Relay Protocol).
 * In a server-side context (API routes) we use a lightweight ws-based
 * approach. In environments without ws, we degrade gracefully.
 *
 * ARCHITECTURE.md §3 — Logic layer; no DB calls, no React imports.
 */

import { normaliseNostr } from '@/lib/connectors/normalise';
import type { UnifiedFeedItem } from '@/types/connector';

export interface NostrCredentials {
  pubkey: string;
  relays: string[];
}

/**
 * Validate the pubkey format.
 * Accepts 64-char hex or npub1... bech32.
 */
export function isValidNostrPubkey(pubkey: string): boolean {
  if (!pubkey) return false;
  if (/^[0-9a-f]{64}$/i.test(pubkey)) return true;
  if (pubkey.startsWith('npub1') && pubkey.length >= 60) return true;
  return false;
}

/**
 * Verify that the pubkey is structurally valid and at least one relay URL
 * is a valid WebSocket URL.
 * Does NOT connect to a relay — pure validation only (for environments without ws).
 */
export async function nostrVerify(creds: NostrCredentials): Promise<string> {
  if (!isValidNostrPubkey(creds.pubkey)) {
    throw new Error('Invalid Nostr public key. Provide a 64-char hex key or npub1... key.');
  }
  if (!creds.relays || creds.relays.length === 0) {
    throw new Error('At least one relay URL is required (e.g. wss://relay.damus.io).');
  }
  const valid = creds.relays.filter(
    (r) => r.startsWith('wss://') || r.startsWith('ws://'),
  );
  if (valid.length === 0) {
    throw new Error('Relay URLs must start with wss:// or ws://.');
  }
  return creds.pubkey.slice(0, 12) + '…';
}

interface NostrEvent {
  id: string;
  pubkey: string;
  kind: number;
  content?: string;
  created_at?: number;
  tags?: string[][];
}

/**
 * Fetch the following feed from Nostr relays.
 *
 * Server-side: attempts a raw WebSocket connection to the first available relay
 * using Node's built-in WebSocket (Node 22+) or gracefully returns empty if
 * WebSocket is unavailable in this environment.
 *
 * Returns normalised feed items.
 */
export async function nostrSync(creds: NostrCredentials): Promise<UnifiedFeedItem[]> {
  if (!isValidNostrPubkey(creds.pubkey)) {
    throw new Error('Invalid Nostr public key.');
  }

  // Try to use native WebSocket (Node 22+) or fall back to empty
  // This avoids requiring an external ws package.
  const WSClass = typeof WebSocket !== 'undefined' ? WebSocket : null;
  if (!WSClass) {
    // WebSocket not available in this environment — return empty gracefully
    return [];
  }

  const events = await fetchNostrEvents(creds, WSClass);
  return events.map((e) => normaliseNostr(e));
}

async function fetchNostrEvents(
  creds: NostrCredentials,
  WSClass: typeof WebSocket,
): Promise<NostrEvent[]> {
  const hexPubkey = creds.pubkey.startsWith('npub1')
    ? npubToHex(creds.pubkey)
    : creds.pubkey;

  const relays = creds.relays.filter((r) => r.startsWith('wss://') || r.startsWith('ws://'));
  const relay = relays[0];
  if (!relay) return [];

  return new Promise((resolve) => {
    const ws = new WSClass(relay);
    const events: NostrEvent[] = [];
    const subId = `dreamengin-${Math.random().toString(36).slice(2, 8)}`;
    const timer = setTimeout(() => {
      ws.close();
      resolve(events);
    }, 5000);

    ws.onopen = () => {
      const req = JSON.stringify([
        'REQ',
        subId,
        { kinds: [1], authors: [hexPubkey], limit: 40 },
      ]);
      ws.send(req);
    };

    ws.onmessage = (msg: MessageEvent) => {
      try {
        const data = JSON.parse(msg.data as string) as unknown[];
        if (data[0] === 'EVENT' && data[1] === subId) {
          events.push(data[2] as NostrEvent);
        } else if (data[0] === 'EOSE') {
          clearTimeout(timer);
          ws.close();
          resolve(events);
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      clearTimeout(timer);
      ws.close();
      resolve(events);
    };
  });
}

/** Minimal bech32 npub decoder — converts npub1... to 64-char hex pubkey. */
function npubToHex(npub: string): string {
  // We only need the data part after the hrp (npub1)
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  const data = npub.slice(5); // strip 'npub1'
  const decoded: number[] = [];
  for (const c of data) {
    const v = CHARSET.indexOf(c);
    if (v < 0) break;
    decoded.push(v);
  }
  // Convert from 5-bit groups to 8-bit bytes
  const bytes: number[] = [];
  let acc = 0;
  let bits = 0;
  for (const val of decoded) {
    acc = ((acc << 5) | val) & 0xfff;
    bits += 5;
    while (bits >= 8) {
      bits -= 8;
      bytes.push((acc >> bits) & 0xff);
    }
  }
  return bytes
    .slice(0, 32)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function nostrCredentialFields() {
  return [
    {
      key: 'pubkey',
      label: 'Public Key (npub or hex)',
      placeholder: 'npub1... or 64-char hex',
      type: 'text' as const,
      hint: 'Your Nostr public key. Find it in your Nostr client (e.g. Damus, Amethyst, Snort).',
    },
    {
      key: 'relays',
      label: 'Relay URLs (comma-separated)',
      placeholder: 'wss://relay.damus.io, wss://nos.lol',
      type: 'text' as const,
      hint: 'WebSocket relay URLs. Use 1–5 public relays. Default: relay.damus.io, nos.lol.',
    },
  ];
}
