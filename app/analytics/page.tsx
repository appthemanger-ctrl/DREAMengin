import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AnalyticsLegacyPage() {
  // Analytics Daydream surface lives at /daydream/analytics (Phase 6 item 12).
  // Forward all traffic from the legacy /analytics route to the canonical surface.
  redirect('/daydream/analytics');
}
