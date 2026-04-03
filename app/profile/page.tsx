import { redirect } from 'next/navigation';
import { connection } from 'next/server';

/**
 * Legacy profile route — redirects to canonical EditProfileDream.
 *
 * Per docs/ARCHITECTURE.md §2 and docs/PRODUCT_DEFINITION.md, the canonical
 * profile editor is EditProfileDream at /edit-profiledream.
 * This route redirects to maintain backward compatibility.
 */

export default async function ProfileLegacyPage() {
  await connection();
  redirect('/edit-profiledream');
}
