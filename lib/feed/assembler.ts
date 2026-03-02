// ─── Feed Assembler ───────────────────────────────────────────────────────────
// Merges results from multiple providers, ranks, dedupes, and limits output.

import type {
  FeedItem,
  FeedRequest,
  FeedResponse,
  FeedCursor,
  FeedPartialError,
} from './types';
import {
  getEnabledProviders,
  recordSuccess,
  recordFailure,
  isCircuitOpen,
  getHealth,
} from './providers/index';
import { getTheme } from './themes';

const DEFAULT_LIMIT = 40;
const PER_PROVIDER_LIMIT_MULTIPLIER = 2;
const PROVIDER_TIMEOUT_MS = 4000;

// ─── Main assembler ───────────────────────────────────────────────────────────

export async function assembleFeed(req: FeedRequest): Promise<FeedResponse> {
  const limit = req.limit ?? DEFAULT_LIMIT;
  const providers = getEnabledProviders(req.theme);
  const partialErrors: FeedPartialError[] = [];
  const providerCursors: Record<string, string> = {};

  // Respect sourceType filter
  const filteredProviders = providers.filter((p) => {
    if (!req.sourceType || req.sourceType === 'mixed') return true;
    return p.type === req.sourceType;
  });

  // Restore per-provider cursors from the incoming cursor
  const incomingCursors = req.cursor?.providerCursors ?? {};

  // Fetch from all providers in parallel with per-provider timeouts
  const results = await Promise.allSettled(
    filteredProviders.map(async (provider) => {
      if (isCircuitOpen(provider.id)) {
        const h = getHealth(provider.id);
        partialErrors.push({
          providerId: provider.id,
          message: h.statusExplainer,
        });
        return { items: [] as FeedItem[], providerId: provider.id };
      }

      const pReq: FeedRequest = {
        ...req,
        limit: limit * PER_PROVIDER_LIMIT_MULTIPLIER,
        cursor: incomingCursors[provider.id]
          ? { providerCursors: { [provider.id]: incomingCursors[provider.id] }, lastSeenTimestamp: '' }
          : undefined,
      };

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Provider timeout')), PROVIDER_TIMEOUT_MS)
      );

      try {
        const result = await Promise.race([provider.fetch(pReq), timeoutPromise]);
        recordSuccess(provider.id);
        if (result.nextCursor) {
          providerCursors[provider.id] = result.nextCursor;
        }
        return { items: result.items, providerId: provider.id };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        recordFailure(provider.id, msg);
        partialErrors.push({ providerId: provider.id, message: msg });
        return { items: [] as FeedItem[], providerId: provider.id };
      }
    })
  );

  // Collect all items
  const allItems: FeedItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') allItems.push(...r.value.items);
  }

  // Pipeline: dedupe → age filter → safety → theme score → interleave → limit
  const deduped = dedupe(allItems);
  const ageCapped = applyAgeFilter(deduped, req.maxAgeHours ?? 48);
  const safe = applySafetyFilter(ageCapped, req.theme, req.safeMode ?? false);
  const scored = applyThemeScoring(safe, req.theme);
  const interleaved = interleave(scored);
  const final = interleaved.slice(0, limit);

  const oldestTs = final.length > 0
    ? final[final.length - 1].publishedAt
    : new Date().toISOString();

  const nextCursor: FeedCursor | null = final.length >= limit
    ? { providerCursors, lastSeenTimestamp: oldestTs }
    : null;

  return {
    items: final,
    nextCursor,
    partialErrors,
    assembledAt: new Date().toISOString(),
    fromCache: false,
  };
}

// ─── Dedupe ───────────────────────────────────────────────────────────────────

function canonicalKey(item: FeedItem): string {
  if (item.url) {
    try {
      const u = new URL(item.url);
      u.hash = '';
      return u.toString();
    } catch { /* fall through */ }
  }
  return item.id;
}

function dedupe(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = canonicalKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Age filter ───────────────────────────────────────────────────────────────

function applyAgeFilter(items: FeedItem[], maxAgeHours: number): FeedItem[] {
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  return items.filter((item) => {
    try {
      return new Date(item.publishedAt).getTime() >= cutoff;
    } catch {
      return true;
    }
  });
}

// ─── Safety ───────────────────────────────────────────────────────────────────

function applySafetyFilter(
  items: FeedItem[],
  theme: string,
  safeMode: boolean
): FeedItem[] {
  return items.filter((item) => {
    // Must have at least title or text
    if (!item.title && !item.text) return false;

    if (safeMode) {
      const profile = getTheme(theme as Parameters<typeof getTheme>[0]);
      const blocked = profile.blockedWords;
      if (blocked.length > 0) {
        const lower = `${item.title ?? ''} ${item.text}`.toLowerCase();
        if (blocked.some((w) => lower.includes(w.toLowerCase()))) return false;
      }
    }
    return true;
  });
}

// ─── Theme scoring ────────────────────────────────────────────────────────────

function applyThemeScoring(items: FeedItem[], theme: string): FeedItem[] {
  const profile = getTheme(theme as Parameters<typeof getTheme>[0]);
  const keywords = profile.keywords.map((k) => k.toLowerCase());

  // Sort: newest first, with a small boost for keyword matches
  return items.slice().sort((a, b) => {
    const aText = `${a.title ?? ''} ${a.text}`.toLowerCase();
    const bText = `${b.title ?? ''} ${b.text}`.toLowerCase();
    const aScore = keywords.filter((k) => aText.includes(k)).length;
    const bScore = keywords.filter((k) => bText.includes(k)).length;

    // Primary sort: keyword score (desc)
    if (bScore !== aScore) return bScore - aScore;

    // Secondary sort: publishedAt desc
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

// ─── Source interleaving ──────────────────────────────────────────────────────
// Avoids consecutive runs of items from the same provider.
// Round-robin by provider.

function interleave(items: FeedItem[]): FeedItem[] {
  const byProvider = new Map<string, FeedItem[]>();
  for (const item of items) {
    const bucket = byProvider.get(item.providerId) ?? [];
    bucket.push(item);
    byProvider.set(item.providerId, bucket);
  }

  const providers = [...byProvider.keys()];
  const result: FeedItem[] = [];
  let remaining = items.length;

  while (remaining > 0) {
    let added = 0;
    for (const id of providers) {
      const bucket = byProvider.get(id)!;
      if (bucket.length > 0) {
        result.push(bucket.shift()!);
        added++;
        remaining--;
      }
    }
    if (added === 0) break;
  }

  return result;
}
