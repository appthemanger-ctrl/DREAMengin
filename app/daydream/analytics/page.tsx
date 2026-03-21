import { redirect } from 'next/navigation';

/**
 * Legacy analytics daydream route — repurposed to the Brand Daydream.
 *
 * Analytics (reach, revenue, growth) is a capability of BrandingEngin
 * (Brand Daydream). Per docs/ARCHITECTURE.md §9 and COPILOT_TOOLKIT.md:
 * "Rename and repurpose before rebuilding." This route now forwards traffic
 * to the canonical Brand Daydream at /daydream/brand.
 */
export const dynamic = 'force-dynamic';

export default function AnalyticsDaydreamLegacyPage() {
  redirect('/daydream/brand');
}
