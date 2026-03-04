// app/policy/page.tsx
// TheBoogieMan.Ai — public policy page (req 6–15, K99).
// Readable, versioned, accessible without login, linked from footer + Settings.
// Source of truth: docs/BOOGIEMAN_POLICY.md — this page mirrors it.

import Link from 'next/link';
import { ArrowLeft, Shield, ChevronRight, BookOpen, AlertTriangle, Scale, Eye, Bell, ArrowUpRight, Info, FileText } from 'lucide-react';
import { BOOGIE_POLICY_VERSION } from '@/lib/ai/boogie-policy';

export const metadata = {
  title: 'Community + Safety Policy – DREAMengin',
  description: 'TheBoogieMan.AI community and safety policy. Every rule is versioned and every enforcement action traces back to this page.',
};

// Changelog entries (req K100, 94, 95)
const CHANGELOG = [
  {
    date: '2026-02-27',
    version: 'BOOGIE_POLICY_V1',
    summary: 'Initial policy published. 100 rules across 11 categories (A–K). Enforcement logging includes policy_version + rule_code on every event.',
  },
];

// Policy categories for the table of contents
const CATEGORIES = [
  { id: 'summary',     label: 'Policy Summary',                icon: Info },
  { id: 'scope',       label: 'A — Scope & mission',           icon: BookOpen },
  { id: 'violations',  label: 'C — Violation categories',      icon: AlertTriangle },
  { id: 'allowed',     label: 'D — Allowed content',           icon: Scale },
  { id: 'ladder',      label: 'E — Enforcement ladder',        icon: ArrowUpRight },
  { id: 'strikes',     label: 'F — Strike system',             icon: Shield },
  { id: 'confidence',  label: 'G — Confidence & scoring',      icon: Eye },
  { id: 'messaging',   label: 'H — User messaging',            icon: Bell },
  { id: 'appeals',     label: 'Appeals',                       icon: FileText },
];

export default function PolicyPage() {
  return (
    <div className="de-sky-bg min-h-screen">
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Shield className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Community + Safety Policy</h1>
          <span
            className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(42,138,184,0.12)', color: 'var(--de-accent)' }}
          >
            {BOOGIE_POLICY_VERSION}
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Intro */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Shield className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">TheBoogieMan.AI</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 13, color: 'var(--de-text)', lineHeight: 1.7 }}>
              TheBoogieMan.AI enforces DREAMengin&apos;s community and safety rules. Every enforcement
              action references a specific rule code and policy version from this page — so you can
              always trace any action back to a published, written rule. If you believe an action
              was made in error, you can{' '}
              <Link href="/policy#appeals" style={{ color: 'var(--de-accent)' }}>
                submit an appeal
              </Link>
              .
            </p>
            <p className="mt-2" style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
              Version: <span className="font-mono">{BOOGIE_POLICY_VERSION}</span> · Last updated: <span className="font-mono">2026-02-27</span> ·{' '}
              Source: <span className="font-mono">docs/BOOGIEMAN_POLICY.md</span>
            </p>
          </div>
        </div>

        {/* Policy Summary (req 8) */}
        <section id="summary" className="de-widget" style={{ borderColor: 'rgba(42,138,184,0.3)' }}>
          <div className="de-widget-header">
            <Info className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">Policy Summary — plain language</span>
          </div>
          <div className="de-widget-body">
            <ul style={{ fontSize: 13, color: 'var(--de-text)', lineHeight: 1.8, paddingLeft: 18, listStyle: 'disc' }}>
              <li>TheBoogieMan.AI watches for harmful content and behavior (spam, harassment, illegal activity, etc.).</li>
              <li>It always prefers the <strong>least restrictive</strong> response first — a nudge before a warning, a warning before a lock.</li>
              <li>Every action is <strong>logged</strong>, explained in plain language, and linked to a specific rule on this page.</li>
              <li>You can always <Link href="/policy#appeals" style={{ color: 'var(--de-accent)' }}>appeal any action</Link>. No permanent bans without human review.</li>
              <li><strong>Dr. Eams</strong> explains what happened and what you can do next. <strong>IDARi</strong> handles system-level tuning.</li>
              <li><strong>Dreams</strong> = widget containers. <strong>DayDreams</strong> = full-powered mini-apps. Content inside both is moderated.</li>
            </ul>
            <div className="mt-3" style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
              Version <span className="font-mono">{BOOGIE_POLICY_VERSION}</span> · Last updated 2026-02-27 ·{' '}
              <Link href="/settings/safety" style={{ color: 'var(--de-accent)' }}>View my safety log</Link>
            </div>
          </div>
        </section>

        {/* Table of contents */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">On this page</span>
          </div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <a key={id} href={`#${id}`} className="de-row" style={{ borderRadius: 10 }}>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(42,138,184,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--de-heading)' }}>{label}</span>
                <ChevronRight className="w-4 h-4 ml-auto" style={{ color: 'var(--de-text-dim)' }} />
              </a>
            ))}
          </div>
        </div>

        {/* A — Scope */}
        <section id="scope" className="de-widget">
          <div className="de-widget-header">
            <BookOpen className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">A — Scope, mission, and guarantees</span>
          </div>
          <div className="de-widget-body">
            <PolicyTable rows={[
              ['A1', 'A1_SCOPE',           'Enforces platform safety, integrity, and community rules — not personal opinions.'],
              ['A2', 'A2_PREDICTABLE',     'Actions are predictable: same input → same outcome.'],
              ['A3', 'A3_CONSERVATIVE',    'If uncertain, choose the least harmful action and escalate.'],
              ['A4', 'A4_EXPLAIN',         'Explains itself in user-facing plain language (short + clear).'],
              ['A5', 'A5_NO_SHADOW_BAN',   'Never shadow-bans without a reason visible to staff and the user.'],
              ['A6', 'A6_WARN_FIRST',      'Warns before punishing when possible.'],
              ['A7', 'A7_PREFER_FRICTION', 'Prefers friction (rate limits, nudges) over bans, unless risk is high.'],
              ['A8', 'A8_CONSISTENT',      'Treats all users consistently, regardless of popularity or payment tier.'],
              ['A9', 'A9_PROTECT_MINORS',  'Protects minors and vulnerable groups with extra caution.'],
              ['A10','A10_AUDIT_MINIMAL_DATA', 'Logs actions for audit, but minimizes stored personal data.'],
            ]} />
          </div>
        </section>

        {/* C — Violations */}
        <section id="violations" className="de-widget">
          <div className="de-widget-header">
            <AlertTriangle className="w-4 h-4 mr-2" style={{ color: '#f59e0b' }} />
            <span className="de-widget-title">C — Categories of violations</span>
          </div>
          <div className="de-widget-body">
            <PolicyTable rows={[
              ['C21','C21_HARASSMENT', 'Harassment / targeted abuse (threats, bullying, hate, stalking, doxxing).'],
              ['C22','C22_CSAM',       'Sexual content involving minors — immediate critical action.'],
              ['C23','C23_NCII',       'Non-consensual sexual content or intimate image abuse.'],
              ['C24','C24_VIOLENCE',   'Violence incitement or extremist recruitment.'],
              ['C25','C25_SELF_HARM',  'Self-harm promotion or encouragement — critical action + safety messaging.'],
              ['C26','C26_ILLEGAL',    'Illegal instructions (weapons, hacking, fraud) when actionable.'],
              ['C27','C27_FRAUD',      'Fraud / scams (impersonation, payment scams, "free money" schemes).'],
              ['C28','C28_SPAM',       'Spam (bulk messaging, repeated posting, bot-like activity).'],
              ['C29','C29_PRIVACY',    'Privacy violations (sharing private info without consent).'],
              ['C30','C30_MALWARE',    'Malicious software distribution or phishing links.'],
            ]} />
          </div>
        </section>

        {/* D — Allowed */}
        <section id="allowed" className="de-widget">
          <div className="de-widget-header">
            <Scale className="w-4 h-4 mr-2" style={{ color: '#22c55e' }} />
            <span className="de-widget-title">D — Allowed but limited content</span>
          </div>
          <div className="de-widget-body">
            <PolicyTable rows={[
              ['D31','D31_MATURE_GATED', 'Mature themes allowed if not illegal, not harassment, not exploitation, and properly gated.'],
              ['D32','D32_SATIRE',       'Satire and parody allowed unless it crosses into targeted harassment or impersonation.'],
              ['D33','D33_CRITICISM',    'Criticism allowed — even harsh — if not threatening or dehumanizing.'],
              ['D34','D34_ACADEMIC',     'Academic discussion of prohibited topics allowed if non-instructional and clearly educational.'],
              ['D35','D35_PROFANITY',    'Profanity alone is not a violation unless it is part of harassment or threats.'],
            ]} />
          </div>
        </section>

        {/* E — Enforcement ladder */}
        <section id="ladder" className="de-widget">
          <div className="de-widget-header">
            <ArrowUpRight className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">E — Enforcement ladder</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10, lineHeight: 1.6 }}>
              Default sequence (least → most force):<br />
              <span className="font-mono" style={{ fontSize: 11 }}>
                NUDGE → WARN → THROTTLE → FEATURE_LOCK → QUARANTINE → TEMP_SUSPEND → TEMP_BAN → ESCALATE
              </span>
            </p>
            <PolicyTable rows={[
              ['E36','E36_LADDER',        'Default sequence from nudge to human review.'],
              ['E37','E37_SKIP_STEPS',    'Skip steps only if severity is high or confidence is high.'],
              ['E38','E38_FRICTION',      '"Friction" includes cooldown timers, message limits, posting delays, link restrictions.'],
              ['E39','E39_TEMP_MUTE',     '"Temp mute" blocks posting/commenting; keeps reading access.'],
              ['E40','E40_TEMP_LOCK',     '"Temp lock" blocks specific surfaces (e.g., messaging only).'],
              ['E41','E41_TEMP_BAN',      '"Temp ban" blocks account access; always includes reason + expiry timestamp.'],
              ['E42','E42_PERM_BAN_HUMAN','Permanent bans require human approval — Boogie cannot issue them autonomously.'],
              ['E43','E43_COOLDOWN_SCALE','Cooldowns scale with repeated offenses.'],
              ['E44','E44_EXPIRY',        'Violations expire after a defined window.'],
              ['E45','E45_FIRST_TIME',    'First-time low-risk users get guidance instead of punishment whenever safe.'],
            ]} />
          </div>
        </section>

        {/* F — Strikes */}
        <section id="strikes" className="de-widget">
          <div className="de-widget-header">
            <Shield className="w-4 h-4 mr-2" style={{ color: '#f59e0b' }} />
            <span className="de-widget-title">F — Strike system</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10, lineHeight: 1.6 }}>
              Strike levels: LOW (expires 14d) · MEDIUM (30d) · HIGH (90d) · CRITICAL (180d).
              Weights: LOW=1, MEDIUM=2, HIGH=4, CRITICAL=10.
              All strikes are appealable.
            </p>
            <PolicyTable rows={[
              ['F46','F46_STRIKE_LEVELS',   'Strike levels: LOW, MEDIUM, HIGH, CRITICAL.'],
              ['F47','F47_EXPIRY',          'Expiry windows: 14/30/90/180 days.'],
              ['F50','F50_CRITICAL_ESCALATE','Any Critical strike triggers immediate human review.'],
              ['F51','F51_STRIKE_STORE',    'Stored fields: category, timestamp, confidence, action, evidence pointers.'],
              ['F52','F52_USER_VIEW',       'Users can view a simplified strike summary in Settings.'],
              ['F53','F53_APPEALABLE',      'All strikes are appealable.'],
              ['F54','F54_APPEAL_OUTCOME',  'Appeals can reduce, remove, or confirm strikes.'],
              ['F55','F55_RECALCULATE',     'Removing a strike triggers recalculation of dependent escalations.'],
            ]} />
          </div>
        </section>

        {/* G — Confidence */}
        <section id="confidence" className="de-widget">
          <div className="de-widget-header">
            <Eye className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">G — Confidence &amp; scoring</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 10, lineHeight: 1.6 }}>
              Risk score = severity × confidence × history_multiplier (0–1).
            </p>
            <PolicyTable rows={[
              ['G56','G56_SCORES',      'Every decision includes confidence (0–1) and severity (0–1).'],
              ['G57','G57_LOW_CONFIDENCE','If confidence &lt; 0.60, no temp-ban; only nudge/warn/throttle/lock + escalate.'],
              ['G58','G58_HIGH_SEVERITY', 'If severity ≥ 0.95, action may be immediate even at moderate confidence.'],
              ['G59','G59_HIGH_BOTH',     'High confidence + high severity → stronger actions quickly.'],
              ['G60','G60_AMBIGUOUS',     'If user intent is ambiguous, request clarification before punishing.'],
            ]} />
          </div>
        </section>

        {/* H — Messaging */}
        <section id="messaging" className="de-widget">
          <div className="de-widget-header">
            <Bell className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">H — User messaging &amp; transparency</span>
          </div>
          <div className="de-widget-body">
            <PolicyTable rows={[
              ['H61','H61_PLAIN_REASON',   'Every action shows a short reason in plain language.'],
              ['H62','H62_NEXT_STEP',      '"What you can do now": edit/remove, cool down, or appeal.'],
              ['H63','H63_NO_INTERNALS',   'Detection methods and internal thresholds are never revealed.'],
              ['H64','H64_NO_SHAME',       'Neutral, factual tone — no shaming.'],
              ['H65','H65_CATEGORY',       'Removed content shows which category it violated.'],
              ['H66','H66_POLICY_LINK',    'Every action links to this policy page.'],
              ['H67','H67_TIME_REMAINING', 'Remaining time on any mute/lock/ban is always shown.'],
              ['H68','H68_SAFER_ALT',      'Repeated issues prompt safer alternatives.'],
              ['H69','H69_TONE',           'Gentle tone for low-level actions; serious tone for high-level.'],
              ['H70','H70_CRISIS_RESOURCES','Self-harm context shows crisis resources.'],
            ]} />
          </div>
        </section>

        {/* Appeal (req 13, req 85–89) */}
        <div id="appeals" className="de-widget" style={{ borderColor: 'rgba(42,138,184,0.25)' }}>
          <div className="de-widget-header">
            <Scale className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">Submit an appeal</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 13, color: 'var(--de-text)', lineHeight: 1.6 }}>
              If you received a policy action and believe it was made in error, you can appeal it.
              Appeals pause escalation and are reviewed with full evidence context.
            </p>
            <ul className="mt-2" style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.8, paddingLeft: 16, listStyle: 'disc' }}>
              <li>Provide a short explanation (up to 500 characters).</li>
              <li>Optionally attach a screenshot or evidence.</li>
              <li>If reversed: content is restored and penalty record is cleared where appropriate.</li>
              <li>If upheld: you receive a short explanation and guidance on how to comply next time.</li>
            </ul>
          </div>
          <div className="de-widget-actions">
            <Link href="/settings/safety" className="de-btn de-btn-primary text-xs">
              View Safety Log &amp; Submit Appeal
            </Link>
          </div>
        </div>

        {/* Changelog */}
        <section className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Changelog</span>
          </div>
          <div className="de-widget-body">
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--de-text-dim)' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Version</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Summary</th>
                </tr>
              </thead>
              <tbody>
                {CHANGELOG.map((entry) => (
                  <tr key={entry.version} style={{ borderTop: '1px solid rgba(160,195,240,0.15)' }}>
                    <td style={{ padding: '6px 8px', color: 'var(--de-text-dim)', whiteSpace: 'nowrap' }}>{entry.date}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span className="font-mono" style={{ fontSize: 11, color: 'var(--de-accent)' }}>{entry.version}</span>
                    </td>
                    <td style={{ padding: '6px 8px', color: 'var(--de-text)', lineHeight: 1.5 }}>{entry.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}

// ---- helpers ----------------------------------------------------------------

function PolicyTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ color: 'var(--de-text-dim)' }}>
          <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600, whiteSpace: 'nowrap' }}>#</th>
          <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600, whiteSpace: 'nowrap' }}>Code</th>
          <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600 }}>Rule</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([num, code, desc]) => (
          <tr key={code} style={{ borderTop: '1px solid rgba(160,195,240,0.15)' }}>
            <td style={{ padding: '5px 6px', color: 'var(--de-text-dim)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{num}</td>
            <td style={{ padding: '5px 6px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--de-accent)', background: 'rgba(42,138,184,0.08)', padding: '1px 5px', borderRadius: 4 }}>
                {code}
              </span>
            </td>
            <td style={{ padding: '5px 6px', color: 'var(--de-text)', lineHeight: 1.5, verticalAlign: 'top' }}
              dangerouslySetInnerHTML={{ __html: desc }} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
