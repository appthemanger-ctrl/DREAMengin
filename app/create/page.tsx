import { redirect } from 'next/navigation';

/**
 * Legacy create route — redirects to canonical Create Daydream.
 *
 * Per docs/ARCHITECTURE.md §2 and docs/PRODUCT_DEFINITION.md, the canonical
 * Create surface is the Create Daydream / ContentEngin pair at /daydream/create.
 * This route redirects to maintain backward compatibility.
 */
export const dynamic = 'force-dynamic';

export default function CreateLegacyPage() {
  redirect('/daydream/create');
}
