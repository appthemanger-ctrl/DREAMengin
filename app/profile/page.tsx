import { redirect } from 'next/navigation';

/**
 * Legacy profile route — redirects to canonical EditProfileDream.
 *
 * Per docs/ARCHITECTURE.md §2 and docs/PRODUCT_DEFINITION.md, the canonical
 * profile editor is EditProfileDream at /edit-profiledream.
 * This route redirects to maintain backward compatibility.
 */
export const dynamic = 'force-dynamic';

export default function ProfileLegacyPage() {
  redirect('/edit-profiledream');
}
