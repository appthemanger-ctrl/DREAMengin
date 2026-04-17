-- =============================================================================
-- DREAMENGIN — DreamDocs semantic search RPC
-- =============================================================================
--
-- Companion to 20260417000000_repurpose_nods_as_dream_docs.sql.
-- Provides a Postgres function callable via Supabase RPC that Dr. Eams uses
-- to answer "how do I…" questions from the DreamDM AI bar.
-- =============================================================================

CREATE OR REPLACE FUNCTION search_dream_docs(
  query_embedding  vector(1536),
  match_threshold  FLOAT   DEFAULT 0.75,
  match_count      INT     DEFAULT 5,
  filter_category  TEXT    DEFAULT NULL
)
RETURNS TABLE (
  section_id      BIGINT,
  doc_id          BIGINT,
  doc_slug        TEXT,
  doc_title       TEXT,
  section_heading TEXT,
  section_content TEXT,
  similarity      FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id                                           AS section_id,
    d.id                                           AS doc_id,
    d.slug                                         AS doc_slug,
    d.path                                         AS doc_title,
    s.heading                                      AS section_heading,
    s.content                                      AS section_content,
    (1 - (s.embedding <=> query_embedding))::FLOAT AS similarity
  FROM dream_doc_sections s
  JOIN dream_docs d ON d.id = s.page_id
  WHERE d.published = true
    AND s.embedding IS NOT NULL
    AND (1 - (s.embedding <=> query_embedding)) > match_threshold
    AND (filter_category IS NULL OR d.category = filter_category)
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
