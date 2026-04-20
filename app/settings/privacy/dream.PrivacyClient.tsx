'use client';

/**
 * PrivacyClient — interactive privacy settings persisted to Supabase.
 *
 * Settings are read from and written to /api/settings/privacy (which
 * upserts into the `settings` table under the `privacy` JSONB key).
 * localStorage is used as a fast-load cache only; the source of truth
 * is always the database.
 *
 * Architecture justification: ARCHITECTURE.md §10 (client-side preference
 * state), CONSTITUTION.md Rule 6 (every visible action does something real).
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, EyeOff, UserX, Flag, Check, Loader2, X } from 'lucide-react';

const STORAGE_KEY = 'de-privacy-settings';

interface PrivacySettings {
  publicProfile: boolean;
  appearInSearch: boolean;
  allowFollowers: boolean;
  showActivityStatus: boolean;
  privateByDefault: boolean;
  hideConnectorData: boolean;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  publicProfile: true,
  appearInSearch: true,
  allowFollowers: true,
  showActivityStatus: false,
  privateByDefault: true,
  hideConnectorData: true,
};

function Toggle({
  value,
  onToggle,
  label,
}: {
  value: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={onToggle}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: value ? 'var(--de-accent)' : 'rgba(160,195,240,0.3)',
        position: 'relative',
        cursor: 'pointer',
        border: 'none',
        flexShrink: 0,
        transition: 'background 0.15s',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: value ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          transition: 'left 0.15s',
        }}
      />
    </button>
  );
}

export default function PrivacyClient() {
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealing, setAppealing] = useState(false);
  const [appealMsg, setAppealMsg] = useState('');
  const [showAppealForm, setShowAppealForm] = useState(false);

  // Block list state
  interface BlockEntry { id: string; blocked_id: string; created_at: string; }
  const [blocks, setBlocks] = useState<BlockEntry[]>([]);
  const [blockInput, setBlockInput] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState('');

  // Load block list
  useEffect(() => {
    fetch('/api/blocks')
      .then(r => r.json())
      .then((d: { blocks?: BlockEntry[] }) => { if (d.blocks) setBlocks(d.blocks); })
      .catch(() => {});
  }, []);

  const handleBlock = async () => {
    const id = blockInput.trim();
    if (!id) return;
    setBlockLoading(true);
    setBlockError('');
    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked_id: id }),
      });
      const data = await res.json() as { ok?: boolean; message?: string; block?: BlockEntry };
      if (!res.ok) { setBlockError(data.message ?? 'Failed to block user.'); }
      else if (data.block) { setBlocks(prev => [data.block!, ...prev]); setBlockInput(''); }
    } catch { setBlockError('Network error — please try again.'); }
    finally { setBlockLoading(false); }
  };

  const handleUnblock = async (blocked_id: string) => {
    setBlocks(prev => prev.filter(b => b.blocked_id !== blocked_id));
    await fetch(`/api/blocks?blocked_id=${blocked_id}`, { method: 'DELETE' }).catch(() => {});
  };

  // Load settings on mount — try DB first, fall back to localStorage cache
  useEffect(() => {
    // Immediately apply localStorage cache for fast paint
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PrivacySettings>;
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch { /* ignore */ }

    // Then fetch the real stored settings from Supabase
    fetch('/api/settings/privacy')
      .then((r) => r.json())
      .then((data: { ok: boolean; privacy: Partial<PrivacySettings> | null }) => {
        if (data.ok && data.privacy) {
          setSettings((prev) => ({ ...prev, ...data.privacy }));
          // Update cache
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...data.privacy })); } catch { /* ignore */ }
        }
      })
      .catch(() => { /* keep localStorage values */ });
  }, []);

  const toggle = useCallback((key: keyof PrivacySettings) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Update localStorage cache immediately for fast re-render
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      // Persist to Supabase
      fetch('/api/settings/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => { /* ignore network error — localStorage cache remains */ });
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, []);

  const submitAppeal = useCallback(async () => {
    if (!appealReason.trim()) return;
    setAppealing(true);
    setAppealMsg('');
    try {
      const res = await fetch('/api/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: appealReason.trim() }),
      });
      if (res.ok) {
        setAppealMsg('Appeal submitted. You will be notified when reviewed.');
        setAppealReason('');
        setShowAppealForm(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setAppealMsg((data as { error?: string }).error || 'Submission failed. Please try again.');
      }
    } catch {
      setAppealMsg('Network error. Please try again.');
    } finally {
      setAppealing(false);
    }
  }, [appealReason]);

  const profileToggles: Array<{ key: keyof PrivacySettings; label: string; desc: string }> = [
    { key: 'publicProfile',      label: 'Public profile',      desc: 'Allow anyone to view your /u/handle page.' },
    { key: 'appearInSearch',     label: 'Appear in search',    desc: 'Show in Discover search results.' },
    { key: 'allowFollowers',     label: 'Allow followers',     desc: 'Let others follow your public profile.' },
    { key: 'showActivityStatus', label: 'Show activity status',desc: 'Show when you were last active (friends only).' },
  ];

  const contentToggles: Array<{ key: keyof PrivacySettings; label: string; desc: string }> = [
    { key: 'privateByDefault',  label: 'Private by default',  desc: 'New posts start as private. You choose what to publish.' },
    { key: 'hideConnectorData', label: 'Hide connector data', desc: 'Never reveal which services you use to other users.' },
  ];

  return (
    <div className="de-sky-bg min-h-screen">
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Shield className="w-5 h-5" style={{ color: '#22c55e' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Privacy</h1>
          {saved && (
            <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Profile Visibility</span></div>
          <div className="de-widget-body">
            {profileToggles.map(({ key, label, desc }) => (
              <div key={key} className="de-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{desc}</div>
                </div>
                <Toggle value={settings[key]} onToggle={() => toggle(key)} label={label} />
              </div>
            ))}
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header">
            <EyeOff className="w-4 h-4 mr-2" style={{ color: 'var(--de-text-dim)' }} />
            <span className="de-widget-title">Content Privacy</span>
          </div>
          <div className="de-widget-body">
            {contentToggles.map(({ key, label, desc }) => (
              <div key={key} className="de-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{desc}</div>
                </div>
                <Toggle value={settings[key]} onToggle={() => toggle(key)} label={label} />
              </div>
            ))}
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header">
            <UserX className="w-4 h-4 mr-2" style={{ color: '#dc4444' }} />
            <span className="de-widget-title">Blocked Users</span>
          </div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Block input */}
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={blockInput}
                onChange={e => { setBlockInput(e.target.value); setBlockError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') void handleBlock(); }}
                placeholder="User ID to block…"
                style={{
                  flex: 1, fontSize: 12, padding: '6px 10px', borderRadius: 8,
                  border: '1px solid rgba(160,195,240,0.3)',
                  background: 'rgba(255,255,255,0.6)',
                  color: 'var(--de-text)',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => void handleBlock()}
                disabled={blockLoading || !blockInput.trim()}
                className="de-btn de-btn-primary text-xs"
                style={{ padding: '6px 12px', opacity: blockLoading || !blockInput.trim() ? 0.5 : 1 }}
              >
                {blockLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Block'}
              </button>
            </div>
            {blockError && <p style={{ fontSize: 11, color: '#dc4444' }}>{blockError}</p>}

            {/* Block list */}
            {blocks.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', textAlign: 'center', padding: '8px 0' }}>
                No blocked users.
              </p>
            ) : (
              blocks.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(160,195,240,0.1)' }}>
                  <UserX className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#dc4444', opacity: 0.6 }} />
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--de-text-dim)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.blocked_id}
                  </span>
                  <button
                    onClick={() => void handleUnblock(b.blocked_id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--de-text-dim)', display: 'flex', alignItems: 'center' }}
                    aria-label="Unblock"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="de-widget">
          <div className="de-widget-header">
            <Flag className="w-4 h-4 mr-2" style={{ color: '#f59e0b' }} />
            <span className="de-widget-title">Reports &amp; Appeals</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
              If you&apos;ve received a policy action, you can submit an appeal below. BoogieMan reviews all appeals with a clear reason and timeline.
            </p>
            {appealMsg && (
              <div style={{ marginTop: 8, fontSize: 12, color: appealMsg.includes('submitted') ? '#22c55e' : '#dc4444' }}>
                {appealMsg}
              </div>
            )}
            {showAppealForm && (
              <div style={{ marginTop: 12 }}>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Describe your appeal (required)…"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(160,195,240,0.4)',
                    background: 'rgba(255,255,255,0.6)',
                    fontSize: 12,
                    color: 'var(--de-heading)',
                    resize: 'none',
                    outline: 'none',
                  }}
                />
              </div>
            )}
          </div>
          <div className="de-widget-actions">
            {!showAppealForm ? (
              <button
                type="button"
                className="de-btn de-btn-ghost text-xs"
                onClick={() => setShowAppealForm(true)}
              >
                Submit Appeal
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="de-btn de-btn-ghost text-xs"
                  onClick={() => { setShowAppealForm(false); setAppealReason(''); }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="de-btn de-btn-primary text-xs"
                  onClick={submitAppeal}
                  disabled={appealing || !appealReason.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {appealing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {appealing ? 'Sending…' : 'Submit'}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
