// app/settings/safety/page.tsx
// "Policy & Safety" settings page (req 11, 14, 90–91).
// Shows the user's safety log, appeal options, and a link to the policy.

import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, AlertTriangle, Download, FileText, ChevronRight } from 'lucide-react';
import { BOOGIE_POLICY_VERSION } from '@/lib/ai/boogie-policy';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Policy & Safety – DREAMengin Settings' };

// Placeholder log entries — in production these come from the enforcement log DB.
// Shape matches the audit_event schema from lib/ai/schemas.ts.
const PLACEHOLDER_LOG: {
  event_id: string;
  timestamp: string;
  action: string;
  rule_code: string;
  category: string;
  expiry: string | null;
  policy_version: string;
}[] = [];

export default async function SafetySettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // In production: fetch last 20 enforcement events for this user.
  // const { data: log } = await supabase
  //   .from('policy_events')
  //   .select('*')
  //   .eq('user_id', user.id)
  //   .order('timestamp', { ascending: false })
  //   .limit(20);
  const log = PLACEHOLDER_LOG;

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
          <Shield className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Policy &amp; Safety</h1>
          <span
            className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(42,138,184,0.12)', color: 'var(--de-accent)' }}
          >
            {BOOGIE_POLICY_VERSION}
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Quick links */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Community Policy</span>
          </div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            <Link href="/policy" className="de-row" style={{ borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,138,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Read the Policy</div>
                <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Full community + safety rules — TheBoogieMan.AI</div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--de-text-dim)' }} />
            </Link>
            <Link href="/policy#appeals" className="de-row" style={{ borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,138,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>Appeal a decision</div>
                <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>Believe an action was an error? Submit an appeal.</div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--de-text-dim)' }} />
            </Link>
          </div>
        </div>

        {/* My Safety Log (req 14, 90) */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Shield className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">My Safety Log</span>
          </div>
          <div className="de-widget-body">
            {log.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2">
                <Shield className="w-8 h-8 opacity-15" style={{ color: 'var(--de-accent)' }} />
                <p style={{ fontSize: 13, color: 'var(--de-text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
                  No policy actions on record.<br />
                  <span style={{ fontSize: 11 }}>Good standing — TheBoogieMan.AI has no actions against your account.</span>
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--de-text-dim)' }}>
                    <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600 }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600 }}>Action</th>
                    <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600 }}>Rule</th>
                    <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600 }}>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((entry) => (
                    <tr key={entry.event_id} style={{ borderTop: '1px solid rgba(160,195,240,0.15)' }}>
                      <td style={{ padding: '5px 6px', color: 'var(--de-text-dim)', whiteSpace: 'nowrap' }}>
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '5px 6px' }}>
                        <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '1px 5px', borderRadius: 4 }}>
                          {entry.action}
                        </span>
                      </td>
                      <td style={{ padding: '5px 6px' }}>
                        <Link
                          href={`/policy`}
                          style={{ fontSize: 10, color: 'var(--de-accent)', fontFamily: 'monospace' }}
                          title="View policy rule"
                        >
                          {entry.rule_code}
                        </Link>
                      </td>
                      <td style={{ padding: '5px 6px', color: 'var(--de-text-dim)', whiteSpace: 'nowrap' }}>
                        {entry.expiry ? new Date(entry.expiry).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Download policy log (req 91) */}
          {log.length > 0 && (
            <div className="de-widget-actions">
              <a
                href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(log, null, 2))}`}
                download="dreamengin-safety-log.json"
                className="de-btn de-btn-ghost text-xs"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Download className="w-3 h-3" />
                Download log (JSON)
              </a>
            </div>
          )}
        </div>

        {/* About TheBoogieMan.AI */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">About TheBoogieMan.AI</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
              TheBoogieMan.AI is DREAMengin&apos;s safety system. It enforces the community policy by
              logging enforcement events with rule codes that trace back to the published policy.
              It always prefers the least restrictive action first and never issues a permanent ban
              without human review.
            </p>
            <p className="mt-2" style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
              Policy version: <span className="font-mono">{BOOGIE_POLICY_VERSION}</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
