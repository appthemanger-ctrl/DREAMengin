import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PublicProfileRedirectProps {
  params: Promise<{ handle: string }>;
}

/**
 * Canonical public profile URL: /u/[handle]
 * Redirects to the full profile page at /profile/[handle].
 */
export default async function PublicProfileRedirect({ params }: PublicProfileRedirectProps) {
  const { handle } = await params;
  permanentRedirect(`/profile/${handle}`);
}
