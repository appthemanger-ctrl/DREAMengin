import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analytics Daydream – Dreamengin', description: 'Overview of your reach, revenue, and growth.' };

export default function AnalyticsDaydreamLegacyPage() {
  // Analytics is part of BrandingEngin (README §12.2 — performance views,
  // optimization flows). Redirect to Brand Daydream.
  redirect('/daydream/brand');
}
