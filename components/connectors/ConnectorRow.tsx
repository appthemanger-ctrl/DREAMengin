'use client';
// components/connectors/ConnectorRow.tsx
// Interactive connector row — triggers Connect/Manage/Reconnect (req 11-20)
// Emits onConnectSuccess when OAuth flow completes

import React, { useState } from 'react';
import type { ConnectorDef } from '@/lib/connectors/connectorRegistry';
import type { ConnectorStatus } from '@/lib/connectors/connectorRegistry';
import { CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { track } from '@/lib/telemetry';

function StatusBadge({ status }: { status: ConnectorStatus }) {
  const map: Record<ConnectorStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    connected:      { label: 'Connected',     color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: <CheckCircle size={12} /> },
    not_connected:  { label: 'Not Connected', color: 'var(--de-text-dim)', bg: 'rgba(160,195,240,0.15)', icon: <Clock size={12} /> },
    needs_reauth:   { label: 'Reconnect',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <RefreshCw size={12} /> },
    error:          { label: 'Error',         color: '#dc4444', bg: 'rgba(220,68,68,0.1)',  icon: <AlertCircle size={12} /> },
  };
  const { label, color, bg, icon } = map[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 9999, background: bg, color, fontSize: 10, fontWeight: 700 }}>
      {icon} {label}
    </span>
  );
}

export interface ConnectorRowProps {
  connector: ConnectorDef;
  status: ConnectorStatus;
  /** Called after a successful connection — triggers toast + prompt (req 11) */
  onConnectSuccess: (connectorId: string, connectorName: string) => void;
}

export default function ConnectorRow({ connector, status, onConnectSuccess }: ConnectorRowProps) {
  const [localStatus, setLocalStatus] = useState<ConnectorStatus>(status);
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    if (connecting) return;
    setConnecting(true);
    try {
      // Simulated OAuth flow — in production, redirect to /api/auth/{connector.id}
      // For demo purposes we resolve immediately.
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      setLocalStatus('connected');
      onConnectSuccess(connector.id, connector.name); // req 11: triggers toast + prompt
    } catch {
      setLocalStatus('error');
      track('connect_failure', { connectorId: connector.id });
    } finally {
      setConnecting(false);
    }
  }

  const btnLabel =
    localStatus === 'connected' ? 'Manage' :
    localStatus === 'needs_reauth' ? 'Reconnect' :
    localStatus === 'error' ? 'Retry' : 'Connect';

  return (
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
        <div className="text-xs" style={{ color: 'var(--de-text-dim)', marginTop: 1 }}>
          {connector.description}
        </div>
      </div>
      <button
        type="button"
        disabled={connecting || localStatus === 'connected'}
        onClick={handleConnect}
        className="de-btn de-btn-primary"
        style={{ fontSize: 11, padding: '6px 12px', flexShrink: 0, opacity: connecting ? 0.7 : 1 }}
      >
        {connecting ? '…' : btnLabel}
      </button>
    </div>
  );
}
