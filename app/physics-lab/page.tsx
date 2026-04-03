import { redirect } from 'next/navigation';
import { connection } from 'next/server';

/**
 * Legacy /physics-lab route — archived in v2.0.0.
 *
 * The canonical Lab surface is the Lab Daydream at /daydream/lab,
 * powered by LabEngin with physics simulation capabilities.
 *
 * Per docs/ARCHITECTURE.md §3 (Daydream Surface Network) and docs/LAW.md §Route law.
 */

export default async function PhysicsLabLegacyPage() {
  await connection();
  redirect('/daydream/lab');
}
