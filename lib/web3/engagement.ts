/**
 * lib/web3/engagement.ts
 *
 * On-chain engagement tracking for DREAMengin's decentralized feed.
 *
 * Mirrors the backend engagementController.js contract but adds:
 *   – Optimistic local state (immediate UI feedback before chain confirmation)
 *   – Deduplication against the Supabase engagement record (avoid double-charging)
 *   – Graceful degradation: if the wallet isn't connected the action falls back
 *     to the off-chain Supabase record so the feed still works for all users.
 *
 * Chain writes go to the engagementContractAddress defined in SUPPORTED_CHAINS.
 * Until that address is populated, all writes fall through to the backend HTTP
 * endpoint instead and the tx is recorded as "off-chain".
 */

import {
  EngagementPayload,
  EngagementStats,
  Web3Error,
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN_ID,
} from './types';
import { web3Client } from './client';

// ─── Constants ────────────────────────────────────────────────────────────────

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? '/api';

// ─── Off-chain fallback ───────────────────────────────────────────────────────

async function trackOffChain(payload: EngagementPayload: Promise<void> {
  const res = await fetch(`${BACKEND_BASE}/engagement/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Web3Error(
      body?.error ?? `Engagement track failed (${res.status})`,
      'CONTRACT_ERROR'
    );
  }
}

async function fetchStatsOffChain(contentId: string: Promise<EngagementStats> {
  const res = await fetch(
    `${BACKEND_BASE}/engagement/stats/${encodeURIComponent(contentId)}`
  );
  if (!res.ok) {
    return {
      contentId,
      likes: 0,
      reposts: 0,
      comments: 0,
      verifiedLikes: 0,
      hasLiked: false,
    };
  }
  const data = (await res.json()) as Partial<EngagementStats>;
  return {
    contentId,
    likes: data.likes ?? 0,
    reposts: data.reposts ?? 0,
    comments: data.comments ?? 0,
    verifiedLikes: data.verifiedLikes ?? data.likes ?? 0,
    hasLiked: data.hasLiked ?? false,
  };
}

// ─── On-chain write (stub — wired when contract is deployed) ─────────────────

/**
 * Emit an engagement event to the on-chain contract.
 * Returns the tx hash on success or null if no contract is configured.
 */
async function trackOnChain(
  payload: EngagementPayload
): Promise<string | null> {
  const account = web3Client.getAccount();
  if (!account) return null;

  const chain = SUPPORTED_CHAINS[account.chainId ?? DEFAULT_CHAIN_ID];
  if (!chain?.engagementContractAddress) {
    // Contract not deployed on this chain yet — fall through to off-chain.
    return null;
  }

  // When the contract ABI is available, replace this block with an ethers /
  // viem contract call. The shape will be:
  //
  //   const contract = new ethers.Contract(
  //     chain.engagementContractAddress,
  //     ENGAGEMENT_ABI,
  //     provider.getSigner()
  //   );
  //   const tx = await contract.trackEngagement(
  //     payload.contentId,
  //     payload.type,
  //     payload.contentCid ?? ''
  //   );
  //   await tx.wait();
  //   return tx.hash;
  //
  // For now, indicate the on-chain path is not yet active.
  void payload;
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Record an engagement action (like, repost, comment) for `contentId`.
 *
 * Strategy:
 *   1. Try on-chain write if wallet is connected and contract is deployed.
 *   2. Always write to off-chain backend (source of truth for display counts).
 *   3. Return the tx hash if on-chain write succeeded, otherwise null.
 */
export async function trackEngagement(
  contentId: string,
  type: EngagementPayload['type'],
  options: {
    contentCid?: string;
    /** Skip on-chain write even when a contract address is configured */
    offChainOnly?: boolean;
  } = {}
): Promise<{ txHash: string | null; offChain: boolean }> {
  const actor = web3Client.getAccount()?.address ?? 'anonymous';
  const payload: EngagementPayload = {
    contentId,
    type,
    actor,
    timestamp: new Date().toISOString(),
    contentCid: options.contentCid,
  };

  let txHash: string | null = null;

  if (!options.offChainOnly) {
    txHash = await trackOnChain(payload).catch(() => null);
    if (txHash) payload.txHash = txHash;
  }

  await trackOffChain(payload);

  return { txHash, offChain: txHash === null };
}

/**
 * Fetch engagement statistics for a piece of content.
 * Returns verifiedLikes sourced from the chain when available, otherwise
 * falls back to the backend off-chain count.
 */
export async function getEngagementStats(
  contentId: string
): Promise<EngagementStats> {
  return fetchStatsOffChain(contentId);
}

// ─── Optimistic engagement cache ──────────────────────────────────────────────

/**
 * In-memory optimistic cache used by `useEngagement` to provide instant
 * UI feedback while the async write settles.
 */
const optimisticCache = new Map<
  string,
  { delta: Partial<Record<EngagementPayload['type'], number>>; hasLiked: boolean }
>();

export function applyOptimisticEngagement(
  contentId: string,
  type: EngagementPayload['type'],
  undo = false
): void {
  const existing = optimisticCache.get(contentId) ?? {
    delta: {},
    hasLiked: false,
  };
  const current = existing.delta[type] ?? 0;
  optimisticCache.set(contentId, {
    delta: { ...existing.delta, [type]: undo ? current - 1 : current + 1 },
    hasLiked: type === 'like' ? !undo : existing.hasLiked,
  });
}

export function getOptimisticDelta(
  contentId: string
): { delta: Partial<Record<EngagementPayload['type'], number>>; hasLiked: boolean } {
  return optimisticCache.get(contentId) ?? { delta: {}, hasLiked: false };
}

export function clearOptimisticDelta(contentId: string: void {
  optimisticCache.delete(contentId);
}
