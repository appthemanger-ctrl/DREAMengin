// SURFACE: dreamsurface.Home  (framework-mandated basename: page.tsx)
import { redirect } from 'next/navigation';

/**
 * Legacy Home route — redirects to canonical HomeDream surface.
 */
export default async function HomeLegacyRoutePage() {
  redirect('/homedream');
}
