-- =============================================================================
-- DREAMENGIN — pgvector similarity search RPC function
-- =============================================================================
--
-- Companion to 20260403000001_pgvector_embeddings.sql.
-- Provides a Postgres function callable via Supabase RPC for semantic search.
-- =============================================================================

CREATE OR REPLACE FUNCTION match_content_embeddings(
  query_embedding     vector(1536),
  match_count         INT DEFAULT 10,
  max_distance        FLOAT DEFAULT 1.0,
  filter_content_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  content_id    UUID,
  content_type  TEXT,
  owner_id      UUID,
  distance      FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT
      ce.content_id,
      ce.content_type,
      ce.owner_id,
      (ce.embedding <=> query_embedding)::FLOAT AS distance
    FROM content_embeddings ce
    WHERE
      (filter_content_type IS NULL OR ce.content_type = filter_content_type)
      AND (ce.embedding <=> query_embedding) <= max_distance
    ORDER BY ce.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
