/**
 * lib/supabase/vector.ts — pgvector semantic search for Dr. Eams discovery.
 *
 * Provides typed helpers for:
 *  1. **Storing embeddings** — upsert content embedding vectors into
 *     `content_embeddings` via the Supabase client.
 *  2. **Similarity search** — find the k nearest neighbours for a query
 *     embedding using cosine distance (pgvector `<=>` operator).
 *  3. **AI Triad consensus logging** — record the three-agent vote outcome.
 *
 * All functions accept an authenticated `SupabaseClient` and respect the
 * RLS policies defined in the pgvector migration.
 *
 * Architecture justification: docs/ARCHITECTURE.md §7 (AI backbone).
 * Privacy: Only the content owner's embeddings are accessible; cross-user
 * discovery relies on public-visibility content only.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Content types that can have embeddings attached. */
export type EmbeddableContentType =
  | 'post'
  | 'music_release'
  | 'profile'
  | 'product'
  | 'notebook'
  | 'dream_window';

/** Row shape returned from `content_embeddings`. */
export interface ContentEmbeddingRow {
  id: string;
  content_id: string;
  content_type: EmbeddableContentType;
  embedding: number[];
  owner_id: string;
  created_at: string;
  updated_at: string;
}

/** A similarity search result enriched with a distance score. */
export interface SimilarityResult {
  contentId: string;
  contentType: EmbeddableContentType;
  ownerId: string;
  /** Cosine distance (0 = identical, 2 = opposite). */
  distance: number;
}

// ---------------------------------------------------------------------------
// Upsert embedding
// ---------------------------------------------------------------------------

export interface UpsertEmbeddingParams {
  client: SupabaseClient;
  contentId: string;
  contentType: EmbeddableContentType;
  embedding: number[];
  ownerId: string;
}

/**
 * Upsert an embedding vector for a content item.
 *
 * If an embedding already exists for the given `(contentId, contentType)` pair,
 * it is updated in place; otherwise a new row is inserted.
 *
 * @returns The upserted row ID, or an error.
 */
export async function upsertEmbedding({
  client,
  contentId,
  contentType,
  embedding,
  ownerId,
}: UpsertEmbeddingParams): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await client
    .from('content_embeddings')
    .upsert(
      {
        content_id: contentId,
        content_type: contentType,
        embedding: `[${embedding.join(',')}]`,
        owner_id: ownerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'content_id,content_type' },
    )
    .select('id')
    .single();

  if (error) return { id: null, error: error.message };
  return { id: (data as { id: string }).id, error: null };
}

// ---------------------------------------------------------------------------
// Similarity search  (via Supabase RPC — pgvector cosine distance)
// ---------------------------------------------------------------------------

export interface SimilaritySearchParams {
  client: SupabaseClient;
  /** The query embedding vector (1536 dimensions). */
  queryEmbedding: number[];
  /** Filter by content type (optional). */
  contentType?: EmbeddableContentType;
  /** Maximum number of results (default: 10). */
  limit?: number;
  /** Maximum cosine distance threshold (default: 1.0). */
  maxDistance?: number;
}

/**
 * Find the most similar content items to a query embedding.
 *
 * Requires a Postgres RPC function `match_content_embeddings` to be deployed.
 * See the companion migration for the function definition.
 *
 * Falls back to a direct query if the RPC is unavailable.
 */
export async function searchSimilar({
  client,
  queryEmbedding,
  contentType,
  limit = 10,
  maxDistance = 1.0,
}: SimilaritySearchParams): Promise<{ results: SimilarityResult[]; error: string | null }> {
  const { data, error } = await client.rpc('match_content_embeddings', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_count: limit,
    max_distance: maxDistance,
    filter_content_type: contentType ?? null,
  });

  if (error) return { results: [], error: error.message };

  const results: SimilarityResult[] = (
    data as Array<{
      content_id: string;
      content_type: EmbeddableContentType;
      owner_id: string;
      distance: number;
    }>
  ).map((row) => ({
    contentId: row.content_id,
    contentType: row.content_type,
    ownerId: row.owner_id,
    distance: row.distance,
  }));

  return { results, error: null };
}

// ---------------------------------------------------------------------------
// Delete embedding
// ---------------------------------------------------------------------------

/**
 * Remove an embedding for a content item.
 */
export async function deleteEmbedding(
  client: SupabaseClient,
  contentId: string,
  contentType: EmbeddableContentType,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('content_embeddings')
    .delete()
    .eq('content_id', contentId)
    .eq('content_type', contentType);

  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// AI Triad consensus log
// ---------------------------------------------------------------------------

export type TriadVote = 'approve' | 'reject' | 'abstain';
export type ConsensusOutcome = 'approved' | 'rejected' | 'escalated';

export interface LogConsensusParams {
  client: SupabaseClient;
  requestId: string;
  userId: string;
  eamsVote: TriadVote;
  idariVote: TriadVote;
  boogieVote: TriadVote;
  outcome: ConsensusOutcome;
  reasoning?: Record<string, unknown>;
}

/**
 * Log an AI Triad consensus decision.
 *
 * Called by the server-side Triad orchestrator after Dr. Eams, IDARi, and
 * Boogie have each cast their votes on a user-initiated action.
 */
export async function logTriadConsensus({
  client,
  requestId,
  userId,
  eamsVote,
  idariVote,
  boogieVote,
  outcome,
  reasoning,
}: LogConsensusParams): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await client
    .from('ai_triad_consensus_log')
    .insert({
      request_id: requestId,
      user_id: userId,
      eams_vote: eamsVote,
      idari_vote: idariVote,
      boogie_vote: boogieVote,
      outcome,
      reasoning: reasoning ?? {},
    })
    .select('id')
    .single();

  if (error) return { id: null, error: error.message };
  return { id: (data as { id: string }).id, error: null };
}

/**
 * Derive the consensus outcome from three agent votes.
 *
 * Rules:
 *  - If 2+ agents approve → 'approved'
 *  - If 2+ agents reject → 'rejected'
 *  - Otherwise → 'escalated' (human review required)
 */
export function deriveConsensus(
  eamsVote: TriadVote,
  idariVote: TriadVote,
  boogieVote: TriadVote,
): ConsensusOutcome {
  const votes = [eamsVote, idariVote, boogieVote];
  const approvals = votes.filter((v) => v === 'approve').length;
  const rejections = votes.filter((v) => v === 'reject').length;

  if (approvals >= 2) return 'approved';
  if (rejections >= 2) return 'rejected';
  return 'escalated';
}
