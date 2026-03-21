import { redirect } from 'next/navigation';

/**
 * Legacy analytics daydream route — repurposed to the Lab Daydream.
 *
 * Data analysis is a capability of LabEngin (Lab Daydream), not a standalone
 * Daydream surface. Per docs/ARCHITECTURE.md §9 and COPILOT_TOOLKIT.md:
 * "Rename and repurpose before rebuilding." This route now forwards traffic
 * to the canonical Lab Daydream at /daydream/lab.
 */
export const dynamic = 'force-dynamic';

export default function AnalyticsDaydreamLegacyPage() {
  redirect('/daydream/lab');
}
