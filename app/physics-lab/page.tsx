import { redirect } from 'next/navigation';

/**
 * Legacy /physics-lab route — archived in v2.0.0.
 *
 * The canonical Lab surface is the Lab Daydream at /daydream/lab,
 * powered by LabEngin with physics simulation capabilities.
 *
 * Per docs/ARCHITECTURE.md §3 (Daydream Surface Network) and docs/LAW.md §Route law.
 */
export const dynamic = 'force-dynamic';

export default function PhysicsLabLegacyPage() {
  redirect('/daydream/lab');
}
