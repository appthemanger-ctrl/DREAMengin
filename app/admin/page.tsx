import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import IDariPanel from '@/components/IDariPanel';
import ChildSafetyPanel from '@/components/ChildSafetyPanel';
import Link from 'next/link';
import {
  ArrowLeft, Bot, Shield, Activity, Users, Database,
  CheckCircle, XCircle, Clock, AlertTriangle, Zap
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { isDevAdminBypassActive } from '@/lib/dev-bypass';
import { isOwnerEmail } from '@/lib/ai/triad';
import { createUpgradeReadinessSnapshot } from '@/lib/admin/upgrade-readiness';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin – Dreamengin' };

export default async function AdminPage() {
  let user = null;
  let profile = null;
  let isAdmin = false;

  // Dev admin bypass: when DEV_ADMIN=true the page renders without a real
  // Supabase session so the admin UI can be inspected in dev (req #31–33).
  // IDARi API endpoints remain password-protected regardless.
  const devAdmin = isDevAdminBypassActive();

  if (!devAdmin) {
    try {
      const supabase = await createServerClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
      if (!user) redirect('/login');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('handle, display_name')
        .eq('id', user.id)
        .single();
      profile = profileData;

      // Primary check: owner email match (canonical admin authority)
      // Fallback: user_roles table or legacy metadata/handle check
      if (isOwnerEmail(user.email)) {
        isAdmin = true;
      } else {
         
        const { data: roleData } = await (supabase as any)
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        isAdmin =
          (roleData as { role?: string } | null)?.role === 'admin' ||
          user.user_metadata?.role === 'admin';
      }
    } catch {
      redirect('/login');
    }

    if (!isAdmin) redirect('/');
  }

  const readiness = createUpgradeReadinessSnapshot();
  const signedInLabel = devAdmin
    ? 'Dev admin bypass active'
    : profile?.handle
      ? `Signed in as @${profile.handle}`
      : user?.email
        ? `Signed in as ${user.email}`
        : 'Admin session active';

  type ApprovalStatus = 'approved' | 'rejected' | 'pending';
  const statusIcon: Record<ApprovalStatus, { icon: LucideIcon; color: string }> = {
    approved: { icon: CheckCircle, color: '#22c55e' },
    rejected: { icon: XCircle,     color: '#dc4444' },
    pending:  { icon: Clock,       color: '#f59e0b' },
  };

  return (
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Bot className="w-5 h-5" style={{ color: '#8b5cf6' }} />
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Admin Dashboard</h1>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{signedInLabel}</p>
          </div>
          <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>Admin Only</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-5">

        {/* System health */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Activity className="w-4 h-4 mr-2" style={{ color: '#22c55e' }} />
            <span className="de-widget-title">Upgrade Readiness</span>
          </div>
          <div className="de-widget-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Required Setup', value: `${readiness.setup.requiredPassed}/${readiness.setup.requiredTotal}`, icon: Database, color: readiness.setup.ok ? '#22c55e' : '#dc4444' },
                { label: 'Optional Integrations', value: `${readiness.setup.optionalPassed}/${readiness.setup.optionalTotal}`, icon: Zap, color: '#6366f1' },
                { label: 'Pairs in BUILD', value: `${readiness.build.buildPairs}`, icon: Users, color: '#0ea5e9' },
                { label: 'Overall Progress', value: `${readiness.build.overallProgressPct}%`, icon: CheckCircle, color: '#f59e0b' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="de-surface">
                  <div className="de-metric">
                    <Icon className="w-4 h-4 mb-2" style={{ color }} />
                    <span className="de-metric-value" style={{ fontSize: 22 }}>{value}</span>
                    <span className="de-metric-label">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Triad consensus gating */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">AI Triad · Proposal Gating</span>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)', marginLeft: 8 }}>All 3 must approve for major updates</span>
          </div>
          <div className="de-widget-body">
            {/* Triad status */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { name: 'Dr. Eams',  role: 'User Impact',        color: '#0ea5e9', icon: '🧠', desc: 'Evaluates user experience impact' },
                  { name: 'IDARi',     role: 'Optimization',       color: '#6366f1', icon: '⚡', desc: 'Analyzes performance & efficiency' },
                  { name: 'BoogieMan', role: 'Policy / Overwatch', color: '#f59e0b', icon: '🛡', desc: 'Assesses policy risk & moderation' },
              ].map(({ name, role, color, icon, desc }) => (
                <div key={name} className="de-surface p-3">
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{name}</div>
                  <div style={{ fontSize: 10, color, fontWeight: 600, marginBottom: 4 }}>{role}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)', lineHeight: 1.4 }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* Proposals */}
            {readiness.proposals.map((p) => {
              const allApproved = [p.idari, p.boogieman, p.dreams].every((s) => s.status === 'approved');
              const anyRejected = [p.idari, p.boogieman, p.dreams].some((s) => s.status === 'rejected');
              return (
                <div key={p.id} className="de-surface mb-3" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 1 }}>Impact: {p.impact}</div>
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 9999,
                      fontSize: 10,
                      fontWeight: 700,
                      background: allApproved ? 'rgba(34,197,94,0.1)' : anyRejected ? 'rgba(220,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      color: allApproved ? '#22c55e' : anyRejected ? '#dc4444' : '#f59e0b',
                    }}>
                      {allApproved ? 'Approved' : anyRejected ? 'Blocked' : 'Pending'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[
                        { label: 'IDARi',     data: p.idari     },
                        { label: 'BoogieMan', data: p.boogieman },
                        { label: 'Dr. Eams',  data: p.dreams    },
                      ].map(({ label, data }) => {
                        const { icon: Icon, color } = statusIcon[data.status];
                        return (
                          <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11 }}>
                            <span style={{ color, marginTop: 1, flexShrink: 0 }}><Icon size={14} /></span>
                            <span style={{ color: 'var(--de-text-dim)', minWidth: 70 }}>{label}:</span>
                            <span style={{ color: 'var(--de-text)', lineHeight: 1.4 }}>{data.note}</span>
                          </div>
                        );
                      })}
                  </div>
                  {allApproved && (
                    <details style={{ marginTop: 10 }}>
                      <summary className="de-btn de-btn-primary text-xs" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                        Generate PR Checklist
                      </summary>
                      <div className="de-surface" style={{ marginTop: 10, padding: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 8 }}>
                          {p.plan.title}
                        </div>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: 'var(--de-text)', paddingLeft: 18 }}>
                          {p.checklist.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
            {readiness.proposals.length === 0 && (
              <div className="de-surface" style={{ padding: 14, fontSize: 12, color: 'var(--de-text-dim)' }}>
                All tracked Daydream / Engin pairs are already feature-complete. The next cycle can stay in REFINE mode.
              </div>
            )}
          </div>
        </div>

        {/* Upgrade blockers */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Shield className="w-4 h-4 mr-2" style={{ color: '#f59e0b' }} />
            <span className="de-widget-title">Upgrade Blockers</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
              {readiness.blockers.map((blocker) => (
                <div key={blocker} className="de-surface" style={{ padding: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: blocker.startsWith('No upgrade blockers') ? '#22c55e' : '#f59e0b', flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: 'var(--de-text)', lineHeight: 1.5 }}>
                    {blocker}
                  </p>
                </div>
              ))}
              {readiness.nextTarget && (
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                  Next target: {readiness.nextTarget.manifest.domain} / {readiness.nextTarget.manifest.engin} → {readiness.nextTarget.nextFeature.label}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* iDari AI Console */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Bot className="w-4 h-4 mr-2" style={{ color: '#8b5cf6' }} />
            <span className="de-widget-title">iDari AI Console</span>
          </div>
          <div className="de-widget-body">
            <IDariPanel userId={user?.id ?? ''} isAdmin={isAdmin} />
          </div>
        </div>

        {/* Child Safety Console */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Shield className="w-4 h-4 mr-2" style={{ color: '#dc2626' }} />
            <span className="de-widget-title">Child Safety Console</span>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)', marginLeft: 8 }}>TheBoogieMan.Ai · Zero Tolerance</span>
          </div>
          <div className="de-widget-body">
            <ChildSafetyPanel isAdmin={isAdmin} />
          </div>
        </div>

      </div>
    </div>
  );
}
