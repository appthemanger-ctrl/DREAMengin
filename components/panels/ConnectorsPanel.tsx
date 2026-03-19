'use client';

/**
 * ConnectorsPanel — inline connector management.
 * ConnectorsClient is already a pure client component — use it directly.
 */

import { Plug }            from 'lucide-react';
import ConnectorsClient    from '@/app/connectors/ConnectorsClient';

export default function ConnectorsPanel() {
  return (
    <div style={{ padding: '12px 0 100px' }}>

      <div className="de-notice" style={{ margin: '0 16px 12px' }}>
        <span>
          System integrations connect external services to your feed. Each integration is fully
          editable — update credentials, adjust settings, or disconnect at any time.
        </span>
      </div>

      <ConnectorsClient />

      <div className="de-widget" style={{ margin: '12px 16px 0', background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="de-widget-header">
          <Plug className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
          <span className="de-widget-title">About System Integrations</span>
        </div>
        <div className="de-widget-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { q: 'What permissions does Dreamengin request?',  a: 'Read-only access to your public content and profile. We never post on your behalf.' },
              { q: 'Can I edit or disconnect a service?',         a: 'Yes. Tap Manage on any connected integration to edit its settings or disconnect. Your data is wiped immediately on disconnect.' },
              { q: 'What if a connection expires?',             a: 'The widget shows a "Reconnect" button instead of breaking. Your layout and config are preserved.' },
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
  );
}
