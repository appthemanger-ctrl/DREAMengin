'use client';
/**
 * components/connectors/ConnectorRow.tsx
 *
 * Phase 5 — Truthful connector status row.
 * Never fakes "Connected" via a setTimeout.
 * Calls /api/connectors/{provider}/connect and reflects real server response.
 *
 * Status types (all handled):
 *   connected          → green badge, Manage button
 *   not_connected      → grey badge, Connect button
 *   needs_reauth       → amber badge, Reconnect button
 *   requires_approval  → purple badge, disabled with explanation
 *   unsupported        → muted badge, disabled with explanation
 *   needs_admin_setup  → grey badge, disabled with hint
 *   error              → red badge, Retry button
 *
 * ARCHITECTURE.md §3 — Component layer; no DB calls.
 * AXIOMS.md §3 — Every visible action must do something real.
 */

import React, { useState } from 'react';
import type { ConnectorDef } from '@/lib/connectors/connectorRegistry';
import type { ConnectorStatus } from '@/lib/connectors/connectorRegistry';
import { CheckCircle, AlertCircle, Clock, RefreshCw, Lock, XCircle, Settings } from 'lucide-react';
import { track } from '@/lib/telemetry';

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ConnectorStatus }) {
  const map: Record<ConnectorStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    connected:         { label: 'Connected',      color: '#22c55e', bg: 'rgba(34,197,94,0.1)',    icon: <CheckCircle size={12} /> },
    not_connected:     { label: 'Not Connected',  color: 'var(--de-text-dim)', bg: 'rgba(160,195,240,0.15)', icon: <Clock size={12} /> },
    needs_reauth:      { label: 'Reconnect',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <RefreshCw size={12} /> },
    requires_approval: { label: 'Needs Approval', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  icon: <Lock size={12} /> },
    unsupported:       { label: 'Unsupported',    color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: <XCircle size={12} /> },
    needs_admin_setup: { label: 'Needs Setup',    color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: <Settings size={12} /> },
    error:             { label: 'Error',          color: '#dc4444', bg: 'rgba(220,68,68,0.1)',   icon: <AlertCircle size={12} /> },
  };
  const entry = map[status] ?? map.error;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 9999,
      background: entry.bg, color: entry.color, fontSize: 10, fontWeight: 700,
    }}>
      {entry.icon} {entry.label}
    </span>
  );
}

// ── Credential field types ─────────────────────────────────────────────────

interface CredentialField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password' | 'url';
  hint?: string;
}

// ── Credential modal ───────────────────────────────────────────────────────

function CredentialModal({
  connector,
  fields,
  onSubmit,
  onClose,
  submitting,
  errorMsg,
}: {
  connector: ConnectorDef;
  fields: CredentialField[];
  onSubmit: (creds: Record<string, string>) => void;
  onClose: () => void;
  submitting: boolean;
  errorMsg: string | null;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, ''])),
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div className="de-widget" style={{ width: '100%', maxWidth: 400, margin: 0 }}>
        <div className="de-widget-header">
          <span className="de-widget-title">Connect {connector.name}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--de-text-dim)', fontSize: 18 }}
          >✕</button>
        </div>
        <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {errorMsg && (
            <div style={{ padding: '8px 12px', background: 'rgba(220,68,68,0.1)', borderRadius: 8, color: '#dc4444', fontSize: 12 }}>
              {errorMsg}
            </div>
          )}
          {fields.map((field) => (
            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)' }}>
                {field.label}
              </label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={values[field.key] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 13,
                  border: '1px solid rgba(160,195,240,0.3)',
                  background: 'rgba(160,195,240,0.08)',
                  color: 'var(--de-heading)', outline: 'none', width: '100%',
                }}
              />
              {field.hint && (
                <span style={{ fontSize: 10, color: 'var(--de-text-dim)', lineHeight: 1.4 }}>{field.hint}</span>
              )}
            </div>
          ))}
          <button
            type="button"
            disabled={submitting}
            onClick={() => onSubmit(values)}
            className="de-btn de-btn-primary"
            style={{ marginTop: 4, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Connecting…' : `Connect ${connector.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Credential fields per provider ────────────────────────────────────────

function getCredentialFields(provider: string): CredentialField[] {
  switch (provider) {
    case 'mastodon':
      return [
        { key: 'instance_url', label: 'Instance URL', placeholder: 'https://mastodon.social', type: 'url', hint: 'e.g. https://mastodon.social or https://fosstodon.org' },
        { key: 'access_token', label: 'Access Token', placeholder: 'Paste your access token here', type: 'password', hint: 'Settings → Development → New application → access token.' },
      ];
    case 'bluesky':
      return [
        { key: 'handle', label: 'Bluesky Handle', placeholder: 'yourhandle.bsky.social', type: 'text', hint: 'Your full Bluesky handle.' },
        { key: 'app_password', label: 'App Password', placeholder: 'xxxx-xxxx-xxxx-xxxx', type: 'password', hint: 'bsky.app → Settings → App Passwords. Never use your main password.' },
      ];
    case 'github':
      return [
        { key: 'access_token', label: 'Personal Access Token', placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx', type: 'password', hint: 'github.com → Settings → Developer settings → Personal access tokens (read:user scope).' },
      ];
    case 'nostr':
      return [
        { key: 'pubkey', label: 'Public Key (npub or hex)', placeholder: 'npub1... or 64-char hex', type: 'text', hint: 'Your Nostr public key from Damus, Amethyst, or Snort.' },
        { key: 'relays', label: 'Relay URLs (comma-separated)', placeholder: 'wss://relay.damus.io, wss://nos.lol', type: 'text', hint: 'WebSocket relay URLs.' },
      ];
    default:
      return [
        { key: 'access_token', label: 'Access Token', placeholder: 'Paste your access token here', type: 'password', hint: 'Generate a token from the provider\'s developer settings.' },
      ];
  }
}

// ── Main row component ─────────────────────────────────────────────────────

export interface ConnectorRowProps {
  connector: ConnectorDef;
  status: ConnectorStatus;
  /** Called after a real successful connection — triggers toast + prompt */
  onConnectSuccess: (connectorId: string, connectorName: string) => void;
}

export default function ConnectorRow({ connector, status, onConnectSuccess }: ConnectorRowProps) {
  const initialStatus: ConnectorStatus =
    connector.tier === 'tier3' ? 'unsupported' : status;

  const [localStatus, setLocalStatus] = useState<ConnectorStatus>(initialStatus);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fields = getCredentialFields(connector.id);

  async function handleConnect(creds: Record<string, string>) {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/connectors/${connector.id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: creds }),
      });
      const data = await res.json() as { ok: boolean; status: ConnectorStatus; message?: string };
      setLocalStatus(data.status);
      if (data.ok && data.status === 'connected') {
        setShowModal(false);
        onConnectSuccess(connector.id, connector.name);
        track('connect_success', { connectorId: connector.id });
      } else {
        setErrorMsg(data.message ?? 'Connection failed. Please check your credentials.');
        track('connect_failure', { connectorId: connector.id });
      }
    } catch {
      setErrorMsg('Network error — please try again.');
      setLocalStatus('error');
      track('connect_failure', { connectorId: connector.id });
    } finally {
      setSubmitting(false);
    }
  }

  const btnDisabled =
    localStatus === 'unsupported' ||
    localStatus === 'needs_admin_setup' ||
    localStatus === 'requires_approval' ||
    localStatus === 'connected';

  const btnLabel =
    localStatus === 'connected'         ? 'Manage'        :
    localStatus === 'needs_reauth'      ? 'Reconnect'     :
    localStatus === 'error'             ? 'Retry'         :
    localStatus === 'unsupported'       ? 'Unsupported'   :
    localStatus === 'requires_approval' ? 'Needs approval':
    localStatus === 'needs_admin_setup' ? 'Needs setup'   :
    'Connect';

  const descriptionText =
    localStatus === 'unsupported'
      ? `Not available — ${connector.description}`
      : localStatus === 'requires_approval' || localStatus === 'needs_admin_setup'
      ? connector.requirements ?? connector.description
      : connector.whatYouGet ?? connector.description;

  return (
    <>
      <div className="de-row">
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(42,138,184,0.08)',
          border: '1px solid rgba(42,138,184,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {connector.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>
              {connector.name}
            </span>
            <StatusBadge status={localStatus} />
          </div>
          <div className="text-xs" style={{ color: 'var(--de-text-dim)', marginTop: 1, lineHeight: 1.4 }}>
            {descriptionText}
          </div>
        </div>
        <button
          type="button"
          disabled={btnDisabled}
          onClick={() => !btnDisabled && setShowModal(true)}
          className="de-btn de-btn-primary"
          style={{
            fontSize: 11, padding: '6px 12px', flexShrink: 0,
            opacity: btnDisabled ? 0.45 : 1,
            cursor: btnDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {btnLabel}
        </button>
      </div>

      {showModal && (
        <CredentialModal
          connector={connector}
          fields={fields}
          onSubmit={handleConnect}
          onClose={() => { setShowModal(false); setErrorMsg(null); }}
          submitting={submitting}
          errorMsg={errorMsg}
        />
      )}
    </>
  );
}
