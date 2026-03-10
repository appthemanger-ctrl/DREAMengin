import { redirect } from 'next/navigation';

/**
 * Legacy analytics daydream route — repurposed to the Brand Daydream.
 *
 * Analytics is a capability of BrandingEngin (Brand Daydream Side B), not a
 * standalone Daydream surface. Per docs/ARCHITECTURE.md §9 and COPILOT_TOOLKIT.md:
 * "Rename and repurpose before rebuilding." This route now forwards traffic
 * to the canonical Brand Daydream at /daydream/brand.
 */
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analytics Daydream – Dreamengin', description: 'Overview of your reach, revenue, and growth.' };

export default function AnalyticsDaydreamLegacyPage() {
  // Analytics is part of BrandingEngin (README §12.2 — performance views,
  // optimization flows). Redirect to Brand Daydream.
  redirect('/daydream/brand');
}
