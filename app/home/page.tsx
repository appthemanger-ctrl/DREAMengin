import { redirect } from 'next/navigation';
import { connection } from 'next/server';

/**
 * Legacy /home route — redirects to canonical HomeDream surface.
 */
export default async function HomeLegacyRoutePage() {
  await connection();
  redirect('/homedream');
}
