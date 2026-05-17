'use client';

/**
 * DataClient — wires the "Request Data Export" button to the real API.
 *
 * Constitution Rule 6-7: every visible button must do something real.
 * GET /api/account/export-data returns a JSON snapshot that the browser saves.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Database, Download, Trash2, AlertTriangle, Check, Loader2 } from 'lucide-react';

export default function DataClient() {
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportMsg('');
    try {
      const res = await fetch('/api/account/export-data');
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setExportMsg((j as { error?: string }).error || 'Export failed. Please try again.');
        return;
      }
      const data = await res.json();
      // Trigger browser download of the JSON snapshot
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dreamengin-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportMsg('Export downloaded successfully.');
    } catch {
      setExportMsg('Network error. Please try again.');
    } finally {
      setExporting(false);
    }
  }, []);

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
              Download a JSON copy of your data including profile, posts, widget configurations, and connected services.
            </p>
            {exportMsg && (
              <p style={{ fontSize: 12, color: exportMsg.includes('success') ? '#22c55e' : '#dc4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                {exportMsg.includes('success') ? <Check className="w-3 h-3" /> : null}
                {exportMsg}
              </p>
            )}
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              className="de-btn de-btn-ghost text-xs"
              onClick={handleExport}
              disabled={exporting}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              {exporting ? 'Exporting…' : 'Request Data Export'}
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
                <strong>What stays:</strong> Your login (email + password) remains active.<br />
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
