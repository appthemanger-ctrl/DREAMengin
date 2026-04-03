import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plug } from 'lucide-react';
import ConnectorsClient from './ConnectorsClient';
import { connection } from 'next/server';

export const metadata = { title: 'System Integrations – Dreamengin', description: 'Connect and configure your system integrations.' };

export default async function ConnectorsPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Plug className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>System Integrations</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        <div className="de-notice">
          <span>
            System integrations let you connect external services and configure exactly how they appear in your feed.
            Each integration is fully editable — update credentials, adjust settings, or disconnect at any time.
          </span>
        </div>

        {/* Interactive connector rows + install flow (req 1-100) */}
        <ConnectorsClient />

        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">About System Integrations</span></div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { q: 'What permissions does Dreamengin request?', a: 'Read-only access to your public content and profile. We never post on your behalf.' },
                { q: 'Can I edit or disconnect a service?', a: 'Yes. Tap Manage on any connected integration to edit its settings or disconnect. Your data is wiped immediately on disconnect.' },
                { q: 'What if a connection expires?', a: 'The widget shows a "Reconnect" button instead of breaking. Your layout and config are preserved.' },
              ].map(({ q, a }) => (
                <div key={q} style={{ padding: '10px 0', borderBottom: '1px solid rgba(160,195,240,0.18)' }}>
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--de-heading)' }}>{q}</div>
                  <div className="text-xs" style={{ color: 'var(--de-text-dim)', lineHeight: 1.5 }}>{a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
