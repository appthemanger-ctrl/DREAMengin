import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Cpu } from 'lucide-react';
import AlgorithmEngine from '@/components/feed/AlgorithmEngine';
import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader';
import { connection } from 'next/server';

export const metadata = {
  title: 'My Algorithm – Dreamengin',
  description: 'Build your own feed. Your rules, your presets, your order.',
};

export default async function AlgorithmPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="de-sky-bg min-h-screen">
      <AuthenticatedPageHeader
        backHref="/settings"
        title="My Algorithm"
        subtitle="Your rules, presets, and ranking logic — tuned from a single control room."
        icon={<Cpu className="w-4 h-4" />}
        accentColor="var(--de-accent)"
        badge="Settings"
      />

      <div className="de-auth-content">
        <AlgorithmEngine />
      </div>
    </div>
  );
}
