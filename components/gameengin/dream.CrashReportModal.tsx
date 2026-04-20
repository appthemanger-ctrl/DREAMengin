'use client';

/**
 * components/gameengin/dream.CrashReportModal.tsx
 *
 * Player-facing crash window described in the Brain directive:
 *   "When a cartridge crashes or hits a critical bug, a window opens. The
 *    player can send a statement directly to Maestro describing what happened.
 *    That feedback goes straight into the Brain — into the Project History
 *    for that cartridge."
 *
 * Posts to POST /api/gameengin/crash-report. The endpoint enforces the
 * Two-Project Rule (only active cartridges accepted) and the 16 KB cap.
 */

import { useEffect, useId, useRef, useState } from 'react';

/** Mirrors `CRASH_REPORT_MAX_BYTES` in lib/gameengin/brain-reader.ts. */
export const CRASH_REPORT_MAX_BYTES = 16 * 1024;
/** Hard cap on the textarea so the player can't paste a megabyte of text. */
const STATEMENT_MAX_CHARS = 4000;

export interface CrashContext {
  cartridgeId: string;
  cartridgeLabel?: string;
  version?: string;
  /** Captured at the moment the modal opened. */
  error?: { name?: string; message?: string; stack?: string };
  /** Free-form gameplay context (current scene, last input, etc). */
  gameplay?: Record<string, unknown>;
}

export interface CrashReportModalProps {
  open: boolean;
  context: CrashContext | null;
  onClose: () => void;
  /** Override the POST target — primarily for tests. */
  endpoint?: string;
  /** Override fetch — primarily for tests. */
  fetcher?: typeof fetch;
}

type SendState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string };

export default function CrashReportModal({
  open,
  context,
  onClose,
  endpoint = '/api/gameengin/crash-report',
  fetcher,
}: CrashReportModalProps) {
  const [statement, setStatement] = useState('');
  const [send, setSend] = useState<SendState>({ kind: 'idle' });
  const headingId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset whenever the modal is freshly opened so a previous "sent" state
  // doesn't leak into the next crash.
  useEffect(() => {
    if (open) {
      setStatement('');
      setSend({ kind: 'idle' });
      // Defer focus until the textarea is mounted.
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [open]);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !context) return null;

  const trimmed = statement.trim();
  const canSubmit = trimmed.length > 0 && send.kind !== 'sending' && send.kind !== 'sent';

  async function submit() {
    if (!context || !canSubmit) return;
    setSend({ kind: 'sending' });
    const payload = {
      cartridge_id: context.cartridgeId,
      player_statement: trimmed,
      version: context.version,
      error: context.error,
      context: context.gameplay,
    };
    const body = JSON.stringify(payload);
    if (new Blob([body]).size > CRASH_REPORT_MAX_BYTES) {
      setSend({ kind: 'error', message: 'Report too large (16 KB max). Please shorten your description.' });
      return;
    }
    try {
      const f = fetcher ?? fetch;
      const res = await f(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      });
      if (res.status === 201) {
        setSend({ kind: 'sent' });
        return;
      }
      let msg = `Server returned ${res.status}`;
      try {
        const j = await res.json() as { error?: string };
        if (j.error) msg = j.error;
      } catch { /* keep default */ }
      setSend({ kind: 'error', message: msg });
    } catch (err) {
      setSend({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to send report',
      });
    }
  }

  const errLabel = context.error
    ? `${context.error.name ?? 'Error'}: ${context.error.message ?? '(no message)'}`
    : 'A critical bug stopped the cartridge.';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      data-testid="gameengin-crash-modal"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(2, 3, 10, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'linear-gradient(180deg, #0a1226 0%, #04060f 100%)',
        border: '1px solid rgba(252, 165, 165, 0.35)',
        borderRadius: 14,
        boxShadow: '0 18px 48px rgba(252, 80, 80, 0.18)',
        color: '#e8eef9',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 22,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span aria-hidden style={{ fontSize: 22 }}>⚠️</span>
          <h2 id={headingId} style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fca5a5' }}>
            Cartridge crashed
          </h2>
        </div>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#cbd5e1' }}>
          <strong style={{ color: '#f5f8ff' }}>{context.cartridgeLabel ?? context.cartridgeId}</strong>
          {context.version ? ` · v${context.version}` : ''}
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 11, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>
          {errLabel}
        </p>

        {send.kind === 'sent' ? (
          <div role="status" style={{ padding: 14, fontSize: 13, color: '#bbf7d0' }}>
            ✅ Sent to Maestro. Thanks — this will be in the Brain on the next dispatch cycle.
            <div style={{ marginTop: 14, textAlign: 'right' }}>
              <button
                type="button"
                onClick={onClose}
                style={btnStyle('#1f2a44', '#cbd5e1')}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <label htmlFor={`${headingId}-statement`} style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              What happened?
            </label>
            <textarea
              id={`${headingId}-statement`}
              ref={textareaRef}
              value={statement}
              onChange={(e) => setStatement(e.target.value.slice(0, STATEMENT_MAX_CHARS))}
              maxLength={STATEMENT_MAX_CHARS}
              placeholder="Describe what you were doing, what you saw, and what broke."
              rows={5}
              style={{
                width: '100%', boxSizing: 'border-box',
                marginTop: 6, padding: 10,
                background: '#02030a',
                color: '#e8eef9',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                fontSize: 13, lineHeight: 1.5, resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ marginTop: 4, fontSize: 10, color: '#64748b', textAlign: 'right' }}>
              {statement.length} / {STATEMENT_MAX_CHARS}
            </div>

            {send.kind === 'error' && (
              <div role="alert" style={{
                marginTop: 8, padding: '8px 10px',
                background: 'rgba(252, 80, 80, 0.08)',
                border: '1px solid rgba(252, 80, 80, 0.3)',
                borderRadius: 8, fontSize: 12, color: '#fca5a5',
              }}>
                {send.message}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 14 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={send.kind === 'sending'}
                style={btnStyle('#1f2a44', '#cbd5e1', send.kind === 'sending')}
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                data-testid="gameengin-crash-submit"
                style={btnStyle('#dc2626', '#fff', !canSubmit)}
              >
                {send.kind === 'sending' ? 'Sending…' : 'Send to Maestro'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function btnStyle(bg: string, fg: string, disabled = false): React.CSSProperties {
  return {
    appearance: 'none',
    border: 'none',
    borderRadius: 999,
    padding: '8px 18px',
    fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
    background: bg, color: fg,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}
