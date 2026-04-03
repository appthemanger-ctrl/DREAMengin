import { redirect } from 'next/navigation';
import { connection } from 'next/server';


export default async function AnalyticsLegacyPage() {
  await connection();
  // Analytics Daydream surface lives at /daydream/analytics (Phase 6 item 12).
  // Forward all traffic from the legacy /analytics route to the canonical surface.
  redirect('/daydream/analytics');
}
