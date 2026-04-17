import { redirect } from 'next/navigation';
<<<<<<< copilot/implement-canonical-route-system
import { connection } from 'next/server';

/**
 * Legacy /home route — redirects to canonical HomeDream surface.
 */
export default async function HomeLegacyRoutePage() {
  await connection();
=======

/**
 * Legacy Home route — redirects to canonical HomeDream surface.
 */
export default async function HomeLegacyRoutePage() {
>>>>>>> completedream
  redirect('/homedream');
}
