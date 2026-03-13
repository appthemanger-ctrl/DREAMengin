import { redirect } from 'next/navigation';

/**
 * /home — legacy support route for HomeDream.
 *
 * The canonical HomeDream route is /homedream (docs/ARCHITECTURE.md §2).
 * This page permanently redirects all traffic to the canonical route.
 *
 * Architecture justification: ARCHITECTURE.md §2 — canonical route is /homedream;
 * /home is listed as a support/legacy route only.
 */
export default function HomeLegacy() {
  redirect('/homedream');
}
