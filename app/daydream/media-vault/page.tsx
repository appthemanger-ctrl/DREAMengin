import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function MediaVaultLegacyPage() {
  // Media Vault is part of ContentEngin (README §13 — media composition,
  // mixed-content authoring). Redirect to Create Daydream.
  redirect('/daydream/create');
}
