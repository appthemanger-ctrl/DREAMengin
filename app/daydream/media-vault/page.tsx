import { redirect } from 'next/navigation';

/**
 * Legacy media-vault daydream route — repurposed to the Create Daydream.
 *
 * Media management is a capability of ContentEngin (Create Daydream Side B).
 * Per docs/ARCHITECTURE.md §9 and COPILOT_TOOLKIT.md: "Rename and repurpose
 * before rebuilding." This route now forwards traffic to /daydream/create.
 */
export default function MediaVaultLegacyPage() {
  redirect('/daydream/create');
}
