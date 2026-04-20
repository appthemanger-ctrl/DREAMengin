'use client';

import { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from 'lucide-react';

type ModalType = 'delete-data' | 'delete-account' | null;

/** Premium in-app confirmation modal — replaces browser `window.confirm/prompt` */
function ConfirmModal({
  type,
  onClose,
}: {
  type: ModalType;
  onClose: () => void;
}) {
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (type) {
      setInput('');
      setError('');
      setDone(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [type]);

  if (!type) return null;

  const isAccount = type === 'delete-account';
  const requiredWord = isAccount ? 'DELETE' : 'DELETE MY DATA';
  const isMatch = input.trim().toUpperCase() === requiredWord;

  async function handleConfirm() {
    if (!isMatch) return;
    setPending(true);
    setError('');
    try {
      const endpoint = isAccount ? '/api/account/delete-dream' : '/api/account/delete-data';
      const body = isAccount
        ? { confirm: 'DELETE_MY_DREAM' }
        : { confirm: 'DELETE_MY_DATA' };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { ok?: boolean; error?: { message?: string }; deleted?: string[] };
      if (json.ok) {
        setDone(true);
        if (isAccount) {
          setTimeout(() => { window.location.href = '/'; }, 1800);
        }
      } else {
        setError(json.error?.message ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(10,18,35,0.72)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 env(safe-area-inset-bottom, 0px)',
        animation: 'sicc-glass-in 0.22s cubic-bezier(0.16,1,0.3,1) both',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !pending) onClose(); }}
    >
      {/* Sheet */}
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(248,249,253,0.99) 100%)',
          borderRadius: '28px 28px 0 0',
          padding: '28px 24px 32px',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.18), 0 -1px 0 rgba(200,152,26,0.12)',
          animation: 'sicc-sheet-up 0.34s cubic-bezier(0.16,1,0.3,1) both',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: isAccount ? 'rgba(220,68,68,0.10)' : 'rgba(245,158,11,0.10)',
            border: `1.5px solid ${isAccount ? 'rgba(220,68,68,0.30)' : 'rgba(245,158,11,0.30)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isAccount
              ? <Trash2 size={22} style={{ color: '#dc4444' }} />
              : <ShieldAlert size={22} style={{ color: '#f59e0b' }} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--de-heading)', margin: 0, lineHeight: 1.2 }}>
              {isAccount ? 'Delete Your Account' : 'Delete Your Data'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--de-text-dim)', marginTop: 5, lineHeight: 1.5 }}>
              {isAccount
                ? 'This permanently deletes your account, handle, and all data. This action cannot be undone.'
                : 'This removes your connectors, widgets, and content. Your login and handle are kept.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            style={{
              background: 'rgba(160,195,240,0.18)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, color: 'var(--de-text-dim)',
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Warning callout */}
        <div style={{
          background: isAccount ? 'rgba(220,68,68,0.06)' : 'rgba(245,158,11,0.06)',
          border: `1px solid ${isAccount ? 'rgba(220,68,68,0.20)' : 'rgba(245,158,11,0.20)'}`,
          borderRadius: 14, padding: '12px 14px',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={16} style={{ color: isAccount ? '#dc4444' : '#f59e0b', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: isAccount ? '#dc4444' : '#b45309', margin: 0, lineHeight: 1.55 }}>
            {isAccount
              ? 'Your profile, posts, widgets, connectors, and authentication will be permanently erased.'
              : 'Connections (Spotify, Instagram, etc.), widget layouts, and feed slices will be removed.'}
          </p>
        </div>

        {/* Confirmation input */}
        {!done ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Type <span style={{ color: isAccount ? '#dc4444' : '#f59e0b', fontFamily: 'monospace', letterSpacing: 0 }}>{requiredWord}</span> to confirm
              </label>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && isMatch) void handleConfirm(); }}
                placeholder={requiredWord}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '14px 16px',
                  background: isMatch ? 'rgba(220,68,68,0.05)' : 'rgba(255,255,255,0.85)',
                  border: `1.5px solid ${isMatch ? (isAccount ? 'rgba(220,68,68,0.55)' : 'rgba(245,158,11,0.55)') : 'rgba(180,185,200,0.40)'}`,
                  borderRadius: 14,
                  fontSize: 15, fontWeight: 600, fontFamily: 'monospace',
                  color: 'var(--de-text)', outline: 'none',
                  letterSpacing: '0.05em',
                  transition: 'border 0.18s ease, background 0.18s ease',
                  WebkitAppearance: 'none',
                }}
              />
              {error && (
                <p style={{ fontSize: 12, color: '#dc4444', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertTriangle size={12} /> {error}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                style={{
                  flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid rgba(180,185,200,0.40)',
                  background: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontWeight: 600,
                  fontSize: 14, color: 'var(--de-text)', transition: 'opacity 0.15s',
                  minHeight: 52,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={!isMatch || pending}
                style={{
                  flex: 1.4, padding: '14px', borderRadius: 14, border: 'none',
                  background: isMatch
                    ? (isAccount
                      ? 'linear-gradient(135deg, #dc4444 0%, #b91c1c 100%)'
                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')
                    : 'rgba(180,185,200,0.20)',
                  cursor: isMatch && !pending ? 'pointer' : 'not-allowed',
                  fontWeight: 700, fontSize: 14,
                  color: isMatch ? '#fff' : 'rgba(100,115,135,0.55)',
                  transition: 'background 0.22s ease, color 0.18s ease, box-shadow 0.18s ease',
                  boxShadow: isMatch ? (isAccount ? '0 4px 20px rgba(220,68,68,0.35)' : '0 4px 20px rgba(245,158,11,0.35)') : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  minHeight: 52,
                }}
              >
                {pending
                  ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</>
                  : isAccount ? '🗑 Delete Account' : '🗑 Delete Data'
                }
              </button>
            </div>
          </>
        ) : (
          /* Success / done state */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            padding: '8px 0 4px',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(220,68,68,0.12), rgba(220,68,68,0.06))',
              border: '2px solid rgba(220,68,68,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              ✓
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--de-heading)', margin: '0 0 6px' }}>
                {isAccount ? 'Account Deleted' : 'Data Deleted'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--de-text-dim)', margin: 0 }}>
                {isAccount ? 'You will be redirected shortly…' : 'Your data has been removed successfully.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DangerZoneActions() {
  const [modal, setModal] = useState<ModalType>(null);

  return (
    <>
      <div className="flex flex-col gap-3">
        <div>
          <button
            type="button"
            onClick={() => setModal('delete-data')}
            className="de-btn"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))',
              color: '#b45309',
              border: '1.5px solid rgba(245,158,11,0.35)',
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 14,
              minHeight: 48,
              gap: 8,
              display: 'flex', alignItems: 'center',
            }}
          >
            <ShieldAlert size={16} style={{ color: '#f59e0b' }} />
            Delete My Data
          </button>
          <p className="mt-1.5 text-xs" style={{ color: 'var(--de-text-dim)' }}>
            Removes connections, widgets, and content. Your login is kept.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setModal('delete-account')}
            className="de-btn"
            style={{
              background: 'linear-gradient(135deg, rgba(220,68,68,0.12), rgba(185,28,28,0.08))',
              color: '#dc4444',
              border: '1.5px solid rgba(220,68,68,0.35)',
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 14,
              minHeight: 48,
              gap: 8,
              display: 'flex', alignItems: 'center',
            }}
          >
            <Trash2 size={16} style={{ color: '#dc4444' }} />
            Delete My Account
          </button>
          <p className="mt-1.5 text-xs" style={{ color: 'var(--de-text-dim)' }}>
            Permanently deletes your account and all data. Cannot be undone.
          </p>
        </div>
      </div>

      <ConfirmModal type={modal} onClose={() => setModal(null)} />
    </>
  );
}
