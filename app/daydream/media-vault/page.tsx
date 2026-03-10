import { redirect } from 'next/navigation';

/**
 * Legacy media-vault daydream route — repurposed to the Create Daydream.
 *
 * Media management is a capability of ContentEngin (Create Daydream Side B).
 * Per docs/ARCHITECTURE.md §9 and COPILOT_TOOLKIT.md: "Rename and repurpose
 * before rebuilding." This route now forwards traffic to /daydream/create.
 */
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Media Vault – Dreamengin', description: 'Your private media library.' };

export default function MediaVaultLegacyPage() {
  // Media Vault is part of ContentEngin (README §13 — media composition,
  // mixed-content authoring). Redirect to Create Daydream.
  redirect('/daydream/create');
}
