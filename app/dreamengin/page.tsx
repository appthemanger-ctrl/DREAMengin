import { redirect } from 'next/navigation';
import { connection } from 'next/server';

/**
 * Legacy /dreamengin orbit-shell route — archived in v2.0.0.
 *
 * The canonical runtime entry point is HomeDream Surface at /homedream.
 * DreamenginApp (BabylonWorkspace + orbit navigation) was the v1 shell; it is
 * no longer the active home for the system.
 *
 * Per docs/LAW.md §Route law: support routes should not win the language model.
 * Per docs/ARCHITECTURE.md §3: HomeDream Surface is the runtime root.
 *
 * Any query params (e.g. ?q=) are intentionally dropped — Dr. Eams chat is now
 * handled inside HomeDream via the DrEamsSearchBar and DrEamsPanel overlay.
 */

export default async function DreamenginLegacyPage() {
  await connection();
  redirect('/homedream');
}
