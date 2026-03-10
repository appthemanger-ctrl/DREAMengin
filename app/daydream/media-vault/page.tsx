import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Media Vault – Dreamengin', description: 'Your private media library.' };

export default function MediaVaultLegacyPage() {
  // Media Vault is part of ContentEngin (README §13 — media composition,
  // mixed-content authoring). Redirect to Create Daydream.
  redirect('/daydream/create');
}
