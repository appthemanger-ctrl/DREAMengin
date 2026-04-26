import { permanentRedirect } from 'next/navigation';

export const metadata = { title: 'Dreams – DREAMengin Settings' };

export default function LegacyWidgetsSettingsPage() {
  permanentRedirect('/settings/dreams');
}
