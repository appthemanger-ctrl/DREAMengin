import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * /home — support route for HomeDream Surface.
 * Canonical route is /homedream (docs/ARCHITECTURE.md §2).
 * This redirect keeps legacy bookmarks and links working.
 */
export default function HomeSupportRoute() {
  redirect('/homedream');
}
