'use client';
/**
 * components/connectors/ConnectorRow.tsx
 *
 * Phase 5 — Truthful connector status row.
 * Never fakes "Connected" via a setTimeout.
 * Calls /api/connectors/{provider}/connect and reflects real server response.
 *
 * Status types (all handled):
 *   connected          → green badge, Manage button (opens edit modal with disconnect)
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
import { CheckCircle, AlertCircle, Clock, RefreshCw, Lock, XCircle, Settings, Unplug } from 'lucide-react';
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

// ── Manage modal (shown when already connected) ────────────────────────────

function ManageModal({
  connector,
  onDisconnect,
  onClose,
  disconnecting,
  errorMsg,
}: {
  connector: ConnectorDef;
  onDisconnect: () => void;
  onClose: () => void;
  disconnecting: boolean;
  errorMsg: string | null;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div className="de-widget" style={{ width: '100%', maxWidth: 400, margin: 0 }}>
        <div className="de-widget-header">
          <span className="de-widget-title">Manage {connector.name}</span>
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
          <div style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--de-heading)' }}>{connector.name}</strong> is currently connected.
            {connector.whatYouGet && (
              <span> {connector.whatYouGet}</span>
            )}
          </div>
          <button
            type="button"
            disabled={disconnecting}
            onClick={onDisconnect}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 8,
              background: 'rgba(220,68,68,0.12)',
              border: '1px solid rgba(220,68,68,0.3)',
              color: '#dc4444', fontSize: 13, fontWeight: 600,
              cursor: disconnecting ? 'not-allowed' : 'pointer',
              opacity: disconnecting ? 0.7 : 1,
            }}
          >
            <Unplug size={14} />
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      </div>
    </div>
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

// ── Integration modal (connect + edit + disconnect) ────────────────────────

function IntegrationModal({
  connector,
  fields,
  isEditing,
  onSubmit,
  onDisconnect,
  onClose,
  submitting,
  disconnecting,
  errorMsg,
}: {
  connector: ConnectorDef;
  fields: CredentialField[];
  /** true when already connected — shows Edit header + Disconnect option */
  isEditing: boolean;
  onSubmit: (creds: Record<string, string>) => void;
  onDisconnect: () => void;
  onClose: () => void;
  submitting: boolean;
  disconnecting: boolean;
  errorMsg: string | null;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, ''])),
  );
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div className="de-widget" style={{ width: '100%', maxWidth: 400, margin: 0 }}>
        <div className="de-widget-header">
          <span className="de-widget-title">
            {isEditing ? `Edit ${connector.name} Integration` : `Connect ${connector.name}`}
          </span>
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
          {isEditing && (
            <div style={{ padding: '6px 10px', background: 'rgba(34,197,94,0.08)', borderRadius: 8, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
              ✅ Currently connected. Enter new credentials below to update this integration.
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
            {submitting ? (isEditing ? 'Saving…' : 'Connecting…') : (isEditing ? `Save ${connector.name} Integration` : `Connect ${connector.name}`)}
          </button>

          {/* Disconnect section — only shown for already-connected integrations */}
          {isEditing && (
            <div style={{ marginTop: 4, paddingTop: 10, borderTop: '1px solid rgba(160,195,240,0.18)' }}>
              {!confirmDisconnect ? (
                <button
                  type="button"
                  onClick={() => setConfirmDisconnect(true)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(220,68,68,0.08)', border: '1px solid rgba(220,68,68,0.2)',
                    color: '#dc4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Disconnect {connector.name}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 12, color: 'var(--de-text-dim)', margin: 0, textAlign: 'center' }}>
                    Are you sure? This removes all saved credentials and synced data.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setConfirmDisconnect(false)}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(160,195,240,0.1)', border: '1px solid rgba(160,195,240,0.25)',
                        color: 'var(--de-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={disconnecting}
                      onClick={onDisconnect}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(220,68,68,0.15)', border: '1px solid rgba(220,68,68,0.3)',
                        color: '#dc4444', fontSize: 12, fontWeight: 700, cursor: disconnecting ? 'not-allowed' : 'pointer',
                        opacity: disconnecting ? 0.7 : 1,
                      }}
                    >
                      {disconnecting ? 'Disconnecting…' : 'Yes, Disconnect'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
    case 'youtube':
      return [
        {
          key:         'access_token',
          label:       'Google OAuth Access Token',
          placeholder: 'ya29.a0AfH6S...',
          type:        'password' as const,
          hint:
            'Use "Connect with YouTube" above for the full OAuth flow. ' +
            'Advanced: paste a Google access token with the youtube.readonly scope.',
        },
      ];
    case 'instagram':
      return [
        {
          key:         'access_token',
          label:       'Long-Lived Access Token',
          placeholder: 'IGQ...',
          type:        'password' as const,
          hint:
            'Use "Connect with Instagram" above for the OAuth flow. ' +
            'Advanced: paste a long-lived access token from the Meta developers console.',
        },
      ];
    case 'medium':
      return [
        { key: 'username', label: 'Medium Username', placeholder: 'yourname', type: 'text', hint: 'Your Medium username without @. Found in your profile URL: medium.com/@yourname' },
      ];
    case 'devto':
      return [
        { key: 'username', label: 'Dev.to Username', placeholder: 'yourname', type: 'text', hint: 'Your Dev.to username. Found in your profile URL: dev.to/yourname' },
      ];
    case 'substack':
      return [
        { key: 'publication', label: 'Substack Publication', placeholder: 'mynewsletter', type: 'text', hint: 'Your Substack subdomain (e.g. "mynewsletter") or full URL (e.g. "https://mynewsletter.substack.com").' },
      ];
    case 'hackernews':
      return [
        { key: 'feed_type', label: 'Feed Type', placeholder: 'best', type: 'text', hint: 'Choose: best, newest, ask, show, or jobs. Defaults to "best" if left blank.' },
        { key: 'username', label: 'HN Username (optional)', placeholder: 'pg', type: 'text', hint: 'Optional — fill this to see your own HN submissions instead of a curated feed.' },
      ];
    case 'podcast':
      return [
        {
          key: 'feed_url',
          label: 'RSS / Atom Feed URL',
          placeholder: 'https://example.com/feed.xml',
          type: 'url' as const,
          hint:
            'Any public RSS or Atom feed — podcasts, YouTube channels, Reddit, Mastodon, Substack, blogs, news sites, and more. ' +
            '⚠️ The feed must be publicly accessible. If you get a 401/403 error, go to that platform and make the feed public first.',
        },
      ];
    case 'twitter':
      return [
        {
          key: 'username',
          label: 'Twitter / X Username',
          placeholder: 'yourhandle',
          type: 'text' as const,
          hint:
            'Your Twitter/X username without @. ' +
            '⚠️ Your account MUST be Public. Go to Settings → Privacy and safety → turn off "Protect your posts".',
        },
        {
          key: 'nitter_instance',
          label: 'Nitter Instance (optional)',
          placeholder: 'https://nitter.net',
          type: 'url' as const,
          hint: 'Optional. Leave blank to use nitter.net. Nitter is a free open-source RSS bridge for public Twitter/X profiles.',
        },
      ];
    case 'facebook':
      return [
        {
          key: 'page',
          label: 'Facebook Page URL or Name',
          placeholder: 'https://facebook.com/yourpage',
          type: 'text' as const,
          hint:
            'Paste your Facebook Page URL, username, or numeric Page ID. ' +
            '⚠️ The Page MUST be Public. Go to Page Settings → Privacy → set to Public.',
        },
      ];
    case 'pinterest':
      return [
        {
          key: 'username',
          label: 'Pinterest Username',
          placeholder: 'yourname',
          type: 'text' as const,
          hint:
            'Your Pinterest username. ' +
            '⚠️ Your profile and boards MUST be Public. Go to Pinterest Settings → Privacy → Profile privacy → Public.',
        },
        {
          key: 'board',
          label: 'Board Name (optional)',
          placeholder: 'dream-home',
          type: 'text' as const,
          hint: 'Optional. A specific public board slug. Leave blank to see all your public pins.',
        },
      ];
    case 'tumblr':
      return [
        {
          key: 'username',
          label: 'Tumblr Blog Username',
          placeholder: 'myblog',
          type: 'text' as const,
          hint:
            'Your Tumblr username or blog URL. ' +
            '⚠️ Your blog MUST be Public (not password-protected). Go to blog Settings → remove password protection.',
        },
      ];
    case 'tiktok':
      return [
        {
          key: 'username',
          label: 'TikTok Username',
          placeholder: 'yourusername',
          type: 'text' as const,
          hint:
            'Your TikTok username without @. ' +
            '⚠️ Your account MUST be Public. Go to TikTok → Profile → Settings → Privacy → turn "Private account" OFF.',
        },
        {
          key: 'rsshub_instance',
          label: 'RSSHub Instance (optional)',
          placeholder: 'https://rsshub.app',
          type: 'url' as const,
          hint: 'Optional. Leave blank to use rsshub.app. RSSHub is a free open-source RSS bridge for TikTok public profiles.',
        },
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
  /** Called after a successful disconnect — lets parent remove from connected set */
  onDisconnect?: (connectorId: string) => void;
}

export default function ConnectorRow({ connector, status, onConnectSuccess, onDisconnect }: ConnectorRowProps) {
  const initialStatus: ConnectorStatus =
    connector.tier === 'tier3' ? 'unsupported' : status;

  const [localStatus, setLocalStatus] = useState<ConnectorStatus>(initialStatus);
  const [showModal, setShowModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manageErrorMsg, setManageErrorMsg] = useState<string | null>(null);

  const fields = getCredentialFields(connector.id);
  const isEditing = localStatus === 'connected';

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

  async function handleDisconnect() {
    setDisconnecting(true);
    setManageErrorMsg(null);
    try {
      const res = await fetch(`/api/connectors/${connector.id}/disconnect`, { method: 'DELETE' });
      if (res.ok) {
        setLocalStatus('not_connected');
        setShowManageModal(false);
        setShowModal(false);
        onDisconnect?.(connector.id);
        track('disconnect_success', { connectorId: connector.id });
      } else {
        const data = await res.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
        setManageErrorMsg(data.error ?? 'Disconnect failed. Please try again.');
        track('disconnect_failure', { connectorId: connector.id });
      }
    } catch {
      setManageErrorMsg('Network error — please try again.');
      track('disconnect_failure', { connectorId: connector.id });
    } finally {
      setDisconnecting(false);
    }
  }

  const btnDisabled =
    localStatus === 'unsupported' ||
    localStatus === 'needs_admin_setup' ||
    localStatus === 'requires_approval' ||
    submitting ||
    disconnecting;

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
        {/* OAuth redirect button — shown for providers with a browser-based flow */}
        {connector.oauthStartUrl && localStatus !== 'connected' ? (
          <a
            href={connector.oauthStartUrl}
            className="de-btn de-btn-primary"
            style={{
              fontSize: 11, padding: '6px 12px', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', gap: 4,
              textDecoration: 'none',
            }}
          >
            {connector.icon} Connect with {connector.name}
          </a>
        ) : (
        <button
          type="button"
          disabled={btnDisabled}
          onClick={() => {
            if (btnDisabled) return;
            if (localStatus === 'connected') {
              setManageErrorMsg(null);
              setShowManageModal(true);
            } else {
              setShowModal(true);
            }
          }}
          className="de-btn de-btn-primary"
          style={{
            fontSize: 11, padding: '6px 12px', flexShrink: 0,
            opacity: btnDisabled ? 0.45 : 1,
            cursor: btnDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {btnLabel}
        </button>
        )}
      </div>

      {showModal && (
        <IntegrationModal
          connector={connector}
          fields={fields}
          isEditing={isEditing}
          onSubmit={handleConnect}
          onDisconnect={handleDisconnect}
          onClose={() => { setShowModal(false); setErrorMsg(null); }}
          submitting={submitting}
          disconnecting={disconnecting}
          errorMsg={errorMsg}
        />
      )}

      {showManageModal && (
        <ManageModal
          connector={connector}
          onDisconnect={handleDisconnect}
          onClose={() => { setShowManageModal(false); setManageErrorMsg(null); }}
          disconnecting={disconnecting}
          errorMsg={manageErrorMsg}
        />
      )}
    </>
  );
}

