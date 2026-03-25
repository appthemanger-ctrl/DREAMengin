import { redirect } from 'next/navigation';

/**
 * Legacy /codespace route — archived in v2.0.0.
 *
 * The canonical Code surface is the Code Daydream at /daydream/code,
 * powered by CodeEngin (ShellHub terminal + live editor).
 *
 * Per docs/ARCHITECTURE.md §3 (Daydream Surface Network) and docs/LAW.md §Route law.
 *
 * The ?snippet= query param is not forwarded — CodeEngin manages its own
 * session state via useDaydreamState.
 */
export const dynamic = 'force-dynamic';

export default function CodeSpaceLegacyPage() {
  redirect('/daydream/code');
}
