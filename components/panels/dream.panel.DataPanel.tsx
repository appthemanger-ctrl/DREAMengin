'use client';

/**
 * DataPanel — Data & Privacy settings rendered in Surface Space.
 * Real export API call and account deletion flow.
 * Back → openInSurface('settings'). No routing.
 */

import { useState, useCallback } from 'react';
import { ArrowLeft, Database, Download, Trash2, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';

export default function DataPanel() {
  const { openInSurface } = useDreamSystem();
  const [exporting, setExporting]       = useState(false);
  const [exportMsg, setExportMsg]       = useState('');
  const [deleting, setDeleting]         = useState(false);
  const [deleteMsg, setDeleteMsg]       = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText]   = useState('');

  const handleExport = useCallback(async () => {
    setExporting(true); setExportMsg('');
    try {
      const res = await fetch('/api/account/export-data');
      if (!res.ok) { const j = await res.json().catch(() => ({})); setExportMsg((j as { error?: string }).error || 'Export failed.'); return; }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `dreamengin-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setExportMsg('Export downloaded successfully.');
    } catch { setExportMsg('Network error. Please try again.'); }
    finally { setExporting(false); }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (confirmText !== 'DELETE') { setDeleteMsg('Type DELETE to confirm.'); return; }
    setDeleting(true); setDeleteMsg('');
    try {
      const sb = createClient();
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      if (res.ok) { await sb.auth.signOut(); (window.top ?? window).location.href = '/login'; }
      else { const j = await res.json().catch(() => ({})); setDeleteMsg((j as { error?: string }).error || 'Deletion failed.'); }
    } catch { setDeleteMsg('Network error. Please try again.'); }
    finally { setDeleting(false); }
  }, [confirmText]);

  return (
    <div style={{ paddingBottom: 100 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(244,248,253,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(160,195,240,0.2)', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52 }}>
          <button type="button" onClick={() => openInSurface('settings')} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} style={{ color: 'var(--de-heading)' }} />
          </button>
          <Database size={18} style={{ color: 'var(--de-accent)' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)' }}>Data</span>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        {/* ── System Critical: Volatile Asset Export ── */}
        <div
          className="de-system-critical-modal de-ghost-volatile"
          style={{ padding: '0', overflow: 'hidden' }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(212,175,55,0.18)',
              background: 'rgba(212,175,55,0.06)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Download size={16} style={{ color: '#D4AF37', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.04em' }}>
              SYSTEM CRITICAL — VOLATILE ASSET EXPORT
            </span>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10, lineHeight: 1.5 }}>
              Your data is a <strong style={{ color: '#D4AF37' }}>Ghost asset</strong> — download or lose. Export a JSON copy of your profile, posts, widgets, and connected services before it&apos;s gone.
            </p>
            {exportMsg && (
              <p style={{ fontSize: 12, color: exportMsg.includes('success') ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                {exportMsg.includes('success') ? <Check className="w-3 h-3" /> : null}
                {exportMsg}
              </p>
            )}
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(212,175,55,0.10)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="de-btn-export"
              onClick={handleExport}
              disabled={exporting}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? 'Exporting…' : 'Export Data'}
            </button>
          </div>
        </div>
        <div className="de-widget" style={{ borderColor: 'rgba(220,68,68,0.2)' }}>
          <div className="de-widget-header" style={{ background: 'rgba(220,68,68,0.04)' }}>
            <AlertTriangle className="w-4 h-4 mr-2" style={{ color: '#dc4444' }} />
            <span className="de-widget-title" style={{ color: '#dc4444' }}>Delete Account</span>
          </div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)', marginBottom: 12 }}>Permanently delete your account and all associated data. This cannot be undone.</p>
            {confirmDelete && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 12, color: '#dc4444', marginBottom: 8 }}>Type <strong>DELETE</strong> to confirm permanently deleting your account.</p>
                <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="Type DELETE" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(220,68,68,0.3)', background: 'rgba(255,255,255,0.8)', fontSize: 13, outline: 'none' }} />
                {deleteMsg && <p style={{ fontSize: 12, color: '#dc4444', marginTop: 6 }}>{deleteMsg}</p>}
              </div>
            )}
          </div>
          <div className="de-widget-actions">
            {!confirmDelete ? (
              <button type="button" className="de-btn text-xs" style={{ background: 'rgba(220,68,68,0.08)', color: '#dc4444', border: '1px solid rgba(220,68,68,0.2)' }} onClick={() => setConfirmDelete(true)}>
                <Trash2 className="w-3 h-3" /> Delete Account
              </button>
            ) : (
              <>
                <button type="button" className="de-btn de-btn-ghost text-xs" onClick={() => { setConfirmDelete(false); setConfirmText(''); setDeleteMsg(''); }}>Cancel</button>
                <button type="button" className="de-btn text-xs" style={{ background: '#dc4444', color: '#fff', border: 'none' }} onClick={handleDeleteAccount} disabled={deleting} >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  {deleting ? 'Deleting…' : 'Confirm Delete'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
