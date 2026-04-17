'use server';

/**
 * app/actions/dream-docs.ts
 * Admin-only server actions for creating, publishing, and managing DreamDocs.
 */

import { createServerClient } from '@/lib/supabase/server';
import { isOwnerEmail } from '@/lib/ai/triad';
import { embedDocSection } from '@/lib/dream-docs/embed';
import type { Json } from '@/types/supabase';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    throw new Error('NOT_AUTHENTICATED');
  }

  const isOwner = isOwnerEmail(user.email);

  if (!isOwner) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const role = (roleData as { role?: string } | null)?.role;

    if (role !== 'admin') {
      throw new Error('FORBIDDEN');
    }
  }

  return { userId: user.id };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateDreamDocInput {
  path: string;
  slug?: string;
  category?: 'help' | 'tutorial' | 'policy' | 'release_notes' | 'api_reference' | 'general';
  meta?: Json | null;
  source?: string;
  type?: string;
}

export interface UpsertDocSectionInput {
  docId: number;
  content: string;
  heading?: string;
  slug?: string;
  chunkIndex?: number;
  /** When true, triggers async embedding generation after upsert. */
  generateEmbedding?: boolean;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Create a new DreamDoc (top-level document).
 * Requires admin role.
 */
export async function createDreamDoc(
  input: CreateDreamDocInput,
): Promise<{ id: number | null; error: string | null }> {
  try {
    const { userId } = await requireAdmin();
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('dream_docs')
      .insert({
        path: input.path,
        slug: input.slug ?? null,
        category: input.category ?? 'general',
        meta: input.meta ?? null,
        source: input.source ?? null,
        type: input.type ?? null,
        author_id: userId,
        published: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[dream-docs] createDreamDoc error:', error);
      return { id: null, error: error.message };
    }

    return { id: (data as { id: number }).id, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
    return { id: null, error: msg };
  }
}

/**
 * Publish or unpublish a DreamDoc.
 * Requires admin role.
 */
export async function publishDreamDoc(
  id: number,
  published = true,
): Promise<{ error: string | null }> {
  try {
    await requireAdmin();
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('dream_docs')
      .update({ published, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[dream-docs] publishDreamDoc error:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
    return { error: msg };
  }
}

/**
 * Upsert a content section for a DreamDoc.
 * If `generateEmbedding` is true, the section's content is vectorised and
 * the resulting embedding is persisted on the row.
 * Requires admin role.
 */
export async function upsertDocSection(
  input: UpsertDocSectionInput,
): Promise<{ id: number | null; error: string | null }> {
  try {
    await requireAdmin();
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('dream_doc_sections')
      .upsert(
        {
          page_id: input.docId,
          content: input.content,
          heading: input.heading ?? null,
          slug: input.slug ?? null,
          chunk_index: input.chunkIndex ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'page_id,chunk_index' },
      )
      .select('id')
      .single();

    if (error) {
      console.error('[dream-docs] upsertDocSection error:', error);
      return { id: null, error: error.message };
    }

    const sectionId = (data as { id: number }).id;

    if (input.generateEmbedding && input.content) {
      await embedDocSection(sectionId, input.content);
    }

    return { id: sectionId, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
    return { id: null, error: msg };
  }
}
