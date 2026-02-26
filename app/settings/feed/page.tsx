import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Canonical feed wiring settings URL: /settings/feed
 * Redirects to /feed-settings where the full feed configuration UI lives.
 */
export default function FeedSettingsRedirect() {
  permanentRedirect('/feed-settings');
}
