import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Cpu } from 'lucide-react';
import AlgorithmEngine from '@/components/feed/AlgorithmEngine';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'My Algorithm – DREAMengin',
  description: 'Build your own feed. Your rules, your presets, your order.',
};

export default async function AlgorithmPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="de-sky-bg min-h-screen">
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Cpu className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--de-heading)', lineHeight: 1.1 }}>My Algorithm</div>
            <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>You own your feed</div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-24">
        <AlgorithmEngine />
      </div>
    </div>
  );
}
