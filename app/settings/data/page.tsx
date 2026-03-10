import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Database, Download, Trash2, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Data – Dreamengin Settings' };

export default async function DataSettingsPage() {
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
          <Database className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Data & Privacy</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Export */}
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Export Your Data</span></div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)', marginBottom: 12 }}>
              Download a copy of your data including profile, posts, widget configurations, and connected services.
            </p>
          </div>
          <div className="de-widget-actions">
            <button type="button" className="de-btn de-btn-ghost text-xs">
              <Download className="w-3 h-3" /> Request Data Export
            </button>
          </div>
        </div>

        {/* Delete My Data */}
        <div className="de-widget" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="de-widget-header" style={{ background: 'rgba(245,158,11,0.05)' }}>
            <AlertTriangle className="w-4 h-4 mr-2" style={{ color: '#f59e0b' }} />
            <span className="de-widget-title" style={{ color: '#f59e0b' }}>Delete My Data</span>
          </div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)', marginBottom: 8 }}>
              This wipes your connected services, widget layout, feed slices, and published profile config.
            </p>
            <div className="de-notice" style={{ marginBottom: 0 }}>
              <div>
                <strong>What stays:</strong> Your login (email + password) remains active.<br/>
                <strong>What goes:</strong> Connectors, layout, slices, public profile, all widget configs.
              </div>
            </div>
          </div>
          <div className="de-widget-actions">
            <Link href="/settings/account" className="de-btn text-xs" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
              Delete My Data →
            </Link>
          </div>
        </div>

        {/* Delete Account */}
        <div className="de-widget" style={{ border: '1px solid rgba(220,68,68,0.3)' }}>
          <div className="de-widget-header" style={{ background: 'rgba(220,68,68,0.05)' }}>
            <Trash2 className="w-4 h-4 mr-2" style={{ color: '#dc4444' }} />
            <span className="de-widget-title" style={{ color: '#dc4444' }}>Delete My Dream</span>
          </div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)', marginBottom: 8 }}>
              Permanently deletes your account and all associated data. This action is irreversible.
            </p>
            <div className="de-notice error">
              ⚠️ This cannot be undone. Your account, handle, and all data will be permanently removed.
            </div>
          </div>
          <div className="de-widget-actions">
            <Link href="/settings/account" className="de-btn text-xs" style={{ background: 'rgba(220,68,68,0.1)', color: '#dc4444', border: '1px solid rgba(220,68,68,0.3)' }}>
              Delete Account →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
