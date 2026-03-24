'use client';

/**
 * SafetyPanel — Policy & Safety rendered in Surface Space.
 * Fetches real policy_events from Supabase client-side.
 * Back → openInSurface('settings'). No routing.
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, Shield, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { createClient }    from '@/lib/supabase/client';
import { useDreamSystem }  from '@/lib/dreamdm/DreamSystemContext';
import { BOOGIE_POLICY_VERSION } from '@/lib/ai/boogie-policy';

interface PolicyEvent {
  event_id: string; timestamp: string; action: string;
  rule_code: string; category: string; expiry: string | null; policy_version: string;
}

export default function SafetyPanel() {
  const { openInSurface } = useDreamSystem();
  const [log, setLog]       = useState<PolicyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { setLoading(false); return; }
         
        const { data } = await (sb as any)
          .from('policy_events')
          .select('event_id, timestamp, action, rule_code, category, expiry, policy_version')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(20);
        setLog(data ?? []);
      } catch { /* noop */ }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={{ paddingBottom: 100 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(244,248,253,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(160,195,240,0.2)', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52 }}>
          <button type="button" onClick={() => openInSurface('settings')} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(160,195,240,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} style={{ color: 'var(--de-heading)' }} />
          </button>
          <Shield size={18} style={{ color: 'var(--de-accent)' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)' }}>Policy & Safety</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 999, background: 'rgba(42,138,184,0.12)', color: 'var(--de-accent)' }}>{BOOGIE_POLICY_VERSION}</span>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Community Policy</span></div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            <button type="button" onClick={() => { window.location.href = '/policy'; }} className="de-row" style={{ borderRadius: 10, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,138,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
              </div>
              <div style={{ flex: 1 }}><div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Read the Policy</div><div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Full community + safety rules — TheBoogieMan.AI</div></div>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--de-text-dim)' }} />
            </button>
          </div>
        </div>
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Your Safety Log</span></div>
          <div className="de-widget-body">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--de-accent)' }} /></div>
            ) : log.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--de-text-dim)', textAlign: 'center', padding: '16px 0' }}>No policy events on your account.</p>
            ) : (
              log.map((ev) => (
                <div key={ev.event_id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(160,195,240,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{ev.action}</span>
                    <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{new Date(ev.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{ev.rule_code} · {ev.category}{ev.expiry ? ` · expires ${new Date(ev.expiry).toLocaleDateString()}` : ''}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Appeals</span></div>
          <div className="de-widget-body"><p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>To appeal a policy action, go to Privacy &gt; Reports &amp; Appeals.</p></div>
          <div className="de-widget-actions">
            <button type="button" className="de-btn de-btn-ghost text-xs" onClick={() => openInSurface('settings/privacy')}>Go to Privacy →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
