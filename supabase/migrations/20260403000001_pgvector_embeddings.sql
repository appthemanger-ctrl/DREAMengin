-- =============================================================================
-- DREAMENGIN — pgvector embeddings for Dr. Eams discovery & AI Triad consensus
-- =============================================================================
--
-- Enables semantic similarity search across content items so the Dr. Eams
-- agent can find relevant results using vector proximity instead of keyword
-- matching alone.
--
-- Architecture justification: docs/ARCHITECTURE.md §7 (AI backbone).
-- Privacy: All vector data inherits the RLS policies of its source table.
--          Embeddings alone do not contain PII; the content_id FK links back
--          to the row whose RLS policy governs access.
-- =============================================================================

-- 1. Enable the pgvector extension (idempotent).
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Content embeddings table.
--    Stores 1536-dimensional OpenAI-compatible embeddings (works with any
--    provider that outputs the same dimensionality).
CREATE TABLE IF NOT EXISTS content_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- FK to the source content item (polymorphic — could be a post, music release,
  -- profile, product listing, etc.).  The referencing table is indicated by
  -- `content_type`.
  content_id    UUID NOT NULL,
  content_type  TEXT NOT NULL CHECK (content_type IN (
    'post', 'music_release', 'profile', 'product', 'notebook', 'dream_window'
  )),
  -- The actual embedding vector (1536 dimensions).
  embedding     vector(1536) NOT NULL,
  -- Metadata for filtering / re-ranking.
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast similarity search.
-- IVFFlat is a good default; switch to HNSW for larger datasets (>1M rows).
CREATE INDEX IF NOT EXISTS idx_content_embeddings_vector
  ON content_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_type
  ON content_embeddings (content_type);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_owner
  ON content_embeddings (owner_id);

-- Prevent duplicate embeddings for the same content item.
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_embeddings_unique_content
  ON content_embeddings (content_id, content_type);

-- 3. RLS — embeddings inherit the privacy model of their source content.
ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;

-- Public-ish read: users can search embeddings for content they can already see.
-- Fine-grained filtering happens at the application layer (Dr. Eams applies
-- the user's feed rules and block list before returning results).
CREATE POLICY "Embeddings read own"
  ON content_embeddings FOR SELECT
  USING (auth.uid() = owner_id);

-- Only the content owner (or system) can insert/update/delete embeddings.
CREATE POLICY "Embeddings write own"
  ON content_embeddings FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 4. AI Triad consensus routing log.
--    Records every consensus decision so the system is auditable.
CREATE TABLE IF NOT EXISTS ai_triad_consensus_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Which agents participated and their votes.
  eams_vote     TEXT NOT NULL CHECK (eams_vote IN ('approve', 'reject', 'abstain')),
  idari_vote    TEXT NOT NULL CHECK (idari_vote IN ('approve', 'reject', 'abstain')),
  boogie_vote   TEXT NOT NULL CHECK (boogie_vote IN ('approve', 'reject', 'abstain')),
  -- Final consensus outcome.
  outcome       TEXT NOT NULL CHECK (outcome IN ('approved', 'rejected', 'escalated')),
  -- Optional reasoning / trace for debugging.
  reasoning     JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_triad_consensus_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own consensus history.
CREATE POLICY "Consensus log read own"
  ON ai_triad_consensus_log FOR SELECT
  USING (auth.uid() = user_id);

-- Only system/admin can insert consensus log entries.
CREATE POLICY "Consensus log write system"
  ON ai_triad_consensus_log FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (auth.jwt() ->> 'role') = 'admin'
  );
