/**
 * lib/dream-docs/search.ts
 * Dr. Eams knowledge base semantic search.
 * Used by the AI bar to answer "how do I..." questions.
 */

import { createServerClient } from '@/lib/supabase/server';

export interface DreamDocSearchResult {
  sectionId: number;
  docId: number;
  docSlug: string | null;
  docTitle: string;
  sectionHeading: string | null;
  sectionContent: string | null;
  similarity: number;
}

export interface SearchDreamDocsOptions {
  queryEmbedding: number[];
  matchThreshold?: number;
  matchCount?: number;
  category?: 'help' | 'tutorial' | 'policy' | 'release_notes' | 'api_reference' | 'general';
}

export async function searchDreamDocs(
  options: SearchDreamDocsOptions,
): Promise<DreamDocSearchResult[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc('search_dream_docs', {
    query_embedding: `[${options.queryEmbedding.join(',')}]`,
    match_threshold: options.matchThreshold ?? 0.75,
    match_count: options.matchCount ?? 5,
    filter_category: options.category ?? null,
  });

  if (error) {
    console.error('[dream-docs] search error:', error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    sectionId: row.section_id as number,
    docId: row.doc_id as number,
    docSlug: row.doc_slug as string | null,
    docTitle: row.doc_title as string,
    sectionHeading: row.section_heading as string | null,
    sectionContent: row.section_content as string | null,
    similarity: row.similarity as number,
  }));
}
