// ─── Provider Interface + Registry ───────────────────────────────────────────

import type { FeedItem, FeedRequest, FeedTheme } from '../types';

// ─── Provider interface ───────────────────────────────────────────────────────

export interface ProviderFetchResult {
  items: FeedItem[];
  nextCursor?: string;
}

export interface Provider {
  /** Stable unique id, e.g. "rss", "gdelt", "mastodon-public" */
  id: string;
  type: 'news' | 'social';
  /** Themes this provider contributes to (empty = all themes) */
  supportsThemes: FeedTheme[] | 'all';
  /** Whether a secret/key is required (disabled when missing) */
  requiresConfig: boolean;
  fetch(req: FeedRequest): Promise<ProviderFetchResult>;
}

// ─── Provider Health ─────────────────────────────────────────────────────────

export interface ProviderHealth {
  providerId: string;
  enabled: boolean;
  lastSuccessAt: string | null;
  lastError: string | null;
  rollingFailures: number;
  /** Set when circuit is open; provider paused until this time */
  pausedUntil: string | null;
  /** Human-readable explanation of why the provider is disabled */
  statusExplainer: string;
}

const health = new Map<string, ProviderHealth>();

const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_PAUSE_MS = 5 * 60 * 1000; // 5 minutes

export function getHealth(id: string): ProviderHealth {
  return (
    health.get(id) ?? {
      providerId: id,
      enabled: true,
      lastSuccessAt: null,
      lastError: null,
      rollingFailures: 0,
      pausedUntil: null,
      statusExplainer: 'OK',
    }
  );
}

export function recordSuccess(id: string): void {
  const h = getHealth(id);
  health.set(id, {
    ...h,
    lastSuccessAt: new Date().toISOString(),
    lastError: null,
    rollingFailures: 0,
    pausedUntil: null,
    statusExplainer: 'OK',
  });
}

export function recordFailure(id: string, message: string): void {
  const h = getHealth(id);
  const failures = h.rollingFailures + 1;
  const pausedUntil =
    failures >= CIRCUIT_FAILURE_THRESHOLD
      ? new Date(Date.now() + CIRCUIT_PAUSE_MS).toISOString()
      : null;

  health.set(id, {
    ...h,
    lastError: message,
    rollingFailures: failures,
    pausedUntil,
    statusExplainer:
      pausedUntil
        ? `Circuit open after ${failures} failures; paused until ${pausedUntil}`
        : `Last error: ${message}`,
  });
}

export function isCircuitOpen(id: string): boolean {
  const h = getHealth(id);
  if (!h.pausedUntil) return false;
  if (Date.now() > new Date(h.pausedUntil).getTime()) {
    // Auto-reset after pause window
    health.set(id, { ...h, pausedUntil: null, rollingFailures: 0 });
    return false;
  }
  return true;
}

// ─── Provider Registry ────────────────────────────────────────────────────────

const registry: Provider[] = [];

export function registerProvider(p: Provider): void {
  registry.push(p);
}

export function getEnabledProviders(theme: FeedTheme): Provider[] {
  return registry.filter((p) => {
    if (!p.supportsThemes || p.supportsThemes === 'all') return true;
    return (p.supportsThemes as FeedTheme[]).includes(theme);
  });
}

export function getAllProviderHealth(): ProviderHealth[] {
  return registry.map((p) => getHealth(p.id));
}
