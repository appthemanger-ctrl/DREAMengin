-- =============================================================================
-- DREAMENGIN — Repurpose nods_page / nods_page_section as DreamDocs
-- =============================================================================
--
-- These two tables were leftover Supabase starter artifacts with zero codebase
-- references.  Rather than dropping them we repurpose them as the DreamDocs
-- Knowledge Base: a pgvector-powered, chunked document store that Dr. Eams
-- can query semantically to answer "how do I…" questions in the DreamDM bar.
--
-- Original Supabase starter columns (preserved):
--   nods_page         : id, parent_page_id, path, checksum, meta, type, source
--   nods_page_section : id, page_id (FK → nods_page.id), content, token_count,
--                       embedding, slug, heading
-- =============================================================================

-- Rename tables to match DREAMengin naming authority
ALTER TABLE IF EXISTS nods_page RENAME TO dream_docs;
ALTER TABLE IF EXISTS nods_page_section RENAME TO dream_doc_sections;

-- ---------------------------------------------------------------------------
-- dream_docs — top-level document (help article, tutorial, policy page, etc.)
-- ---------------------------------------------------------------------------

-- Create the table if the rename above was a no-op (fresh install / CI)
CREATE TABLE IF NOT EXISTS dream_docs (
  id              BIGSERIAL PRIMARY KEY,
  parent_page_id  BIGINT REFERENCES dream_docs(id),
  path            TEXT NOT NULL UNIQUE,
  checksum        TEXT,
  meta            JSONB,
  type            TEXT,
  source          TEXT
);

ALTER TABLE dream_docs
  ADD COLUMN IF NOT EXISTS slug       TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS category   TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('help', 'tutorial', 'policy', 'release_notes', 'api_reference', 'general')),
  ADD COLUMN IF NOT EXISTS published  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS author_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ---------------------------------------------------------------------------
-- dream_doc_sections — chunked content with pgvector embeddings
-- ---------------------------------------------------------------------------

-- Create the table if the rename above was a no-op (fresh install / CI)
CREATE TABLE IF NOT EXISTS dream_doc_sections (
  id          BIGSERIAL PRIMARY KEY,
  page_id     BIGINT NOT NULL REFERENCES dream_docs(id) ON UPDATE CASCADE ON DELETE CASCADE,
  content     TEXT,
  token_count INTEGER,
  slug        TEXT,
  heading     TEXT
);

ALTER TABLE dream_doc_sections
  ADD COLUMN IF NOT EXISTS embedding   vector(1536),
  ADD COLUMN IF NOT EXISTS chunk_index INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now();

-- Note: token_count already exists in the original nods_page_section schema,
-- so the ADD COLUMN IF NOT EXISTS is intentionally omitted for it.

-- ---------------------------------------------------------------------------
-- Extend content_embeddings.content_type to include 'dream_doc'
-- ---------------------------------------------------------------------------
ALTER TABLE content_embeddings
  DROP CONSTRAINT IF EXISTS content_embeddings_content_type_check;

ALTER TABLE content_embeddings
  ADD CONSTRAINT content_embeddings_content_type_check
  CHECK (content_type IN (
    'post', 'music_release', 'profile', 'product',
    'notebook', 'dream_window', 'dream_doc'
  ));

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_dream_docs_slug
  ON dream_docs (slug);

CREATE INDEX IF NOT EXISTS idx_dream_docs_category
  ON dream_docs (category);

CREATE INDEX IF NOT EXISTS idx_dream_doc_sections_doc_id
  ON dream_doc_sections (page_id);

CREATE INDEX IF NOT EXISTS idx_dream_doc_sections_embedding
  ON dream_doc_sections
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE dream_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_doc_sections ENABLE ROW LEVEL SECURITY;

-- Published docs are readable by anyone (public knowledge base)
CREATE POLICY "Dream docs public read"
  ON dream_docs FOR SELECT
  USING (published = true);

-- Admins and the doc author can manage docs
CREATE POLICY "Dream docs admin write"
  ON dream_docs FOR ALL
  USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR author_id = auth.uid()
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin'
    OR author_id = auth.uid()
  );

-- Sections are readable when their parent doc is published
CREATE POLICY "Dream doc sections public read"
  ON dream_doc_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dream_docs d
      WHERE d.id = dream_doc_sections.page_id
        AND d.published = true
    )
  );

-- Only admins can write sections
CREATE POLICY "Dream doc sections admin write"
  ON dream_doc_sections FOR ALL
  USING ((auth.jwt() ->> 'role') = 'admin');
