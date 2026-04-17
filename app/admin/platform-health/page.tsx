// app/admin/platform-health/page.tsx
// Phase 9 — IDARi Platform Health admin surface.
//
// Auth-gated: only authenticated admins (is_admin RPC) may access.
// Per LAW.md §9: IDARi is admin-only.
// Per ARCHITECTURE.md §9 (AI Triad): IDARi handles admin builder/optimizer role.

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { PlatformHealth } from '@/components/idari/PlatformHealth';
import { connection } from 'next/server';

export const metadata = {
  title: 'IDARi — Platform Health | DREAMengin Admin',
  description: 'Platform health metrics for IDARi admin surface.',
};

export default async function PlatformHealthPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/homedream');
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold text-[#c9a227] mb-6">IDARi — Platform Health</h1>
      <PlatformHealth />
    </main>
  );
}
