import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AnalyticsDaydreamLegacyPage() {
  // Analytics is part of BrandingEngin (README §12.2 — performance views,
  // optimization flows). Redirect to Brand Daydream.
  redirect('/daydream/brand');
}
