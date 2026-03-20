/**
 * lib/connectors/providers/shellhub.ts
 *
 * ShellHub provider — Tier 1 connector.
 *
 * Required credentials (stored in connector_accounts.token_blob):
 *   { server_url: string; api_key: string }
 *
 * server_url — base URL of the ShellHub instance
 *              (defaults to https://cloud.shellhub.io)
 * api_key    — ShellHub personal API key (Settings → API Keys in the dashboard)
 *
 * No environment variables required — user provides their own credentials.
 *
 * Security (AXIOM 4 — Security by Default):
 *   - SSRF guard: only HTTPS server URLs are permitted.
 *   - Credentials never leave the server; this module is logic-layer only.
 *
 * ARCHITECTURE.md §3 — Logic layer; no DB calls, no React imports.
 */

export const SHELLHUB_DEFAULT_SERVER = 'https://cloud.shellhub.io';
const SHELLHUB_API_BASE = '/api/v1';

// ─── Credential shape ────────────────────────────────────────────────────────

export interface ShellHubCredentials {
  server_url: string;
  api_key: string;
}

// ─── Response shapes from ShellHub API ──────────────────────────────────────

export interface ShellHubDevice {
  uid: string;
  name: string;
  /** MAC address */
  identity: { mac: string };
  /** OS info */
  info: {
    id: string;
    pretty_name: string;
    arch: string;
    version?: string;
  };
  status: 'online' | 'offline' | 'removed' | 'pending' | string;
  online: boolean;
  last_seen: string;
  namespace: string;
}

// ─── Internal helper ─────────────────────────────────────────────────────────

/**
 * Make an authenticated request to a ShellHub API endpoint.
 * Enforces HTTPS to prevent SSRF attacks against internal services.
 */
async function shellhubFetch<T>(
  server_url: string,
  api_key: string,
  path: string,
): Promise<T> {
  let base: URL;
  try {
    base = new URL(server_url.trim());
  } catch {
    throw new Error(`ShellHub: invalid server URL "${server_url}".`);
  }

  if (base.protocol !== 'https:') {
    throw new Error('ShellHub server URL must use HTTPS.');
  }

  // Ensure no path traversal: only use origin + our controlled path
  const url = `${base.origin}${SHELLHUB_API_BASE}${path}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${api_key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    // Server-side only — no caching of credentials
    cache: 'no-store',
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('ShellHub: invalid or expired API key.');
  }
  if (!res.ok) {
    throw new Error(`ShellHub API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Verify credentials by fetching the first page of devices.
 * A 200 response (even with an empty list) confirms the key is valid.
 * Returns a human-readable summary string on success.
 */
export async function shellhubVerify(creds: ShellHubCredentials): Promise<string> {
  const devices = await shellhubFetch<ShellHubDevice[]>(
    creds.server_url,
    creds.api_key,
    '/devices?per_page=1&page=1',
  );
  const count = Array.isArray(devices) ? devices.length : 0;
  return count > 0 ? `Connected — ${count}+ device(s) found` : 'Connected — no devices yet';
}

/**
 * List up to 20 devices from the connected ShellHub instance.
 */
export async function shellhubListDevices(
  creds: ShellHubCredentials,
): Promise<ShellHubDevice[]> {
  const result = await shellhubFetch<ShellHubDevice[] | { data?: ShellHubDevice[] }>(
    creds.server_url,
    creds.api_key,
    '/devices?per_page=20&page=1',
  );
  // Some ShellHub versions wrap in { data: [] }
  if (Array.isArray(result)) return result;
  if (typeof result === 'object' && result !== null && Array.isArray((result as { data?: ShellHubDevice[] }).data)) {
    return (result as { data: ShellHubDevice[] }).data;
  }
  return [];
}

/**
 * Returns the credential field definitions for the ShellHub connector.
 * Used by the UI to render the connection form.
 */
export function shellhubCredentialFields() {
  return [
    {
      key: 'server_url',
      label: 'ShellHub Server URL',
      placeholder: SHELLHUB_DEFAULT_SERVER,
      type: 'url' as const,
      hint: 'Leave as default for ShellHub Cloud, or enter your self-hosted server URL.',
    },
    {
      key: 'api_key',
      label: 'API Key',
      placeholder: 'paste your ShellHub API key here',
      type: 'password' as const,
      hint: 'Create at your ShellHub Dashboard → Settings → API Keys.',
    },
  ] as const;
}
