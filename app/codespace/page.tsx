/**
 * DREAMengin — CodeSpace page (Server Component wrapper)
 *
 * Checks the authenticated Supabase user on the server.
 * Passes isAdminUser=true ONLY when the signed-in email exactly matches
 * the owner account. Everyone else sees the IDE without the admin icon.
 */

import { createServerClient } from '@/lib/supabase/server';
import CodeSpaceClient from './CodeSpaceClient';

// The one and only owner email allowed to see the admin file-browser icon.
const OWNER_EMAIL = 'Appthemanger@gmail.com';

export default async function CodeSpacePage() {
  let isAdminUser = false;

  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    isAdminUser = (user?.email ?? '').toLowerCase() === OWNER_EMAIL.toLowerCase();
  } catch {
    // If Supabase is unconfigured or throws, default to no admin access
    isAdminUser = false;
  }

  return <CodeSpaceClient isAdminUser={isAdminUser} />;
}
