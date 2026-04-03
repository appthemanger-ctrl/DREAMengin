import { redirect } from 'next/navigation';
import { connection } from 'next/server';

/**
 * Legacy /u/[handle] route — redirects to canonical /profile/[handle].
 *
 * Per docs/ARCHITECTURE.md §2 and docs/PRODUCT_DEFINITION.md, the canonical
 * public profile route is /profile/[handle].
 * This route redirects to maintain backward compatibility.
 */

type Params = Promise<{ handle: string }>;

export default async function UHandleLegacyPage({ params }: { params: Params }) {
  await connection();
  const { handle } = await params;
  redirect(`/profile/${handle}`);
}
