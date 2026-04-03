import { permanentRedirect } from 'next/navigation';
import { connection } from 'next/server';


/**
 * Canonical feed wiring settings URL: /settings/feed
 * Redirects to /feed-settings where the full feed configuration UI lives.
 */
export default async function FeedSettingsRedirect() {
  await connection();
  permanentRedirect('/feed-settings');
}
