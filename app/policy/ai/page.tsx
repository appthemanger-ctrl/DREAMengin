// app/policy/ai/page.tsx
// Public AI Triad overview page — /policy/ai
// Describes what each AI agent does without exposing internal telemetry.
// Source of truth: docs/POLICY_TRIAD_OVERVIEW.md + docs/AI_TRIAD_PROTOCOL.md

import Link from 'next/link';
import { ArrowLeft, Bot, Zap, Shield, ArrowRight, Info, BookOpen } from 'lucide-react';
import { TRIAD_PROTOCOL_VERSION } from '@/lib/ai/events';

export const metadata = {
  title: 'AI Triad Overview – DREAMengin',
  description: 'Learn what each DREAMengin AI agent does: Dr. Eams (assistant), IDARi (optimizer), and Boogie (safety). Public overview of the triad system.',
};

const AGENTS = [
  {
    id: 'dr-eams',
    name: 'Dr. Eams',
    subtitle: 'Your assistant',
    icon: Bot,
    color: '#2a8ab8',
    bg: 'rgba(42,138,184,0.10)',
    can: [
      'Talk to you in natural language',
      'Explain what happened on your account',
      'Guide you through features and settings',
      'Relay system status from IDARi',
      'Relay restriction info from Boogie',
    ],
    cannot: [
      'Enforce rules or ban accounts',
      'Change policy thresholds',
      'Operate performance knobs',
      'Reveal internal detection methods',
    ],
  },
  {
    id: 'idari',
    name: 'IDARi',
    subtitle: 'System optimizer',
    icon: Zap,
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.10)',
    can: [
      'Keep the platform fast and reliable',
      'Detect and fix performance issues',
      'Report system health to Dr. Eams',
      'Throttle load when the system is under stress',
    ],
    cannot: [
      'Talk to users directly',
      'Ban or restrict accounts',
      'Change public policy text alone',
      'Override Boogie enforcement decisions',
    ],
  },
  {
    id: 'boogie',
    name: 'Boogie',
    subtitle: 'TheBoogieMan.AI · Safety overwatch',
    icon: Shield,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    can: [
      'Enforce community and safety rules',
      'Apply the enforcement ladder (least force first)',
      'Log every action with a rule code + policy version',
      'Send restriction info to Dr. Eams for explanation',
    ],
    cannot: [
      'Issue permanent bans autonomously (human review required)',
      'Optimize performance',
      'Make UX decisions',
      'Deploy code changes alone',
    ],
  },
];

const CAPABILITY_TABLE = [
  { capability: 'Talk to users', dreams: true, idari: false, boogie: false },
  { capability: 'Enforce / ban', dreams: false, idari: false, boogie: true },
  { capability: 'Throttle system performance', dreams: false, idari: true, boogie: false },
  { capability: 'Change policy thresholds', dreams: false, idari: false, boogie: true },
  { capability: 'Issue permanent bans', dreams: false, idari: false, boogie: false },
  { capability: 'Deploy code', dreams: false, idari: false, boogie: false },
];

const GLOSSARY = [
  { term: 'Dream', def: 'A user-installed widget/app container on your profile.' },
  { term: 'Daydream', def: 'One of 6 specialized first-party experiences (full-powered).' },
  { term: 'Home', def: 'Your main Dream layout — always the center of the experience.' },
  { term: 'Share Code', def: 'A config-only blueprint for sharing a Dream layout. Contains no personal data.' },
  { term: 'Strike', def: 'A counted policy violation event with an expiry window (14–180 days).' },
  { term: 'Appeal', def: 'A user request to review a Boogie enforcement action.' },
  { term: 'System Slow Mode', def: 'IDARi-declared state: platform is under load. Not a user punishment.' },
];

export default function AiTriadPage() {
  return (
    <div className="de-sky-bg min-h-screen">
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/policy" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <Bot className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>AI Triad Overview</h1>
          <span
            className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(42,138,184,0.12)', color: 'var(--de-accent)' }}
          >
            {TRIAD_PROTOCOL_VERSION}
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Intro */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Info className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">About the AI Triad</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 13, color: 'var(--de-text)', lineHeight: 1.7 }}>
              DREAMengin uses three specialized AI agents that work together as one coherent system.
              Each agent has a distinct role with no overlap. They communicate via typed events —
              never freeform chat — so actions are always traceable and consistent.
            </p>
            <p className="mt-2" style={{ fontSize: 12, color: 'var(--de-text-dim)', lineHeight: 1.6 }}>
              Version: <span className="font-mono">{TRIAD_PROTOCOL_VERSION}</span> ·{' '}
              <Link href="/policy" style={{ color: 'var(--de-accent)' }}>Safety policy</Link> ·{' '}
              <Link href="#glossary" style={{ color: 'var(--de-accent)' }}>Glossary</Link>
            </p>
          </div>
        </div>

        {/* Agent cards */}
        {AGENTS.map(({ id, name, subtitle, icon: Icon, color, bg, can, cannot }) => (
          <section key={id} id={id} className="de-widget">
            <div className="de-widget-header">
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: 8, flexShrink: 0,
                }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <div className="de-widget-title" style={{ color }}>{name}</div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 1 }}>{subtitle}</div>
              </div>
            </div>
            <div className="de-widget-body" style={{ paddingTop: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Can do</div>
                  <ul style={{ fontSize: 12, color: 'var(--de-text)', lineHeight: 1.7, paddingLeft: 14, listStyle: 'disc' }}>
                    {can.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cannot do</div>
                  <ul style={{ fontSize: 12, color: 'var(--de-text)', lineHeight: 1.7, paddingLeft: 14, listStyle: 'disc' }}>
                    {cannot.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* Capability table */}
        <section className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Capability comparison</span>
          </div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--de-text-dim)' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Capability</th>
                  <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600, color: '#2a8ab8' }}>Dr. Eams</th>
                  <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600, color: '#7c3aed' }}>IDARi</th>
                  <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600, color: '#f59e0b' }}>Boogie</th>
                </tr>
              </thead>
              <tbody>
                {CAPABILITY_TABLE.map(({ capability, dreams, idari, boogie }) => (
                  <tr key={capability} style={{ borderTop: '1px solid rgba(160,195,240,0.15)' }}>
                    <td style={{ padding: '6px 8px', color: 'var(--de-text)' }}>{capability}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>{dreams ? '✅' : '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>{idari ? '✅' : '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>{boogie ? '✅' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 8, lineHeight: 1.5 }}>
              Permanent bans and code deployments always require a human. No agent can do these autonomously.
            </p>
          </div>
        </section>

        {/* How they communicate */}
        <section className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">How they communicate</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 13, color: 'var(--de-text)', lineHeight: 1.7 }}>
              All three agents communicate via <strong>typed events</strong> — not freeform chat. Every event
              is logged in an audit trail for transparency. You only ever see Dr. Eams. IDARi and
              Boogie operate behind the scenes, sending structured data to Dr. Eams for translation.
            </p>
            <div className="mt-3 space-y-2">
              {[
                { from: 'Boogie', to: 'Dr. Eams', what: 'Restriction state, reason codes, duration, appeal link' },
                { from: 'IDARi', to: 'Dr. Eams', what: 'System degradation state; recommended user guidance' },
                { from: 'Dr. Eams', to: 'Boogie', what: 'User appeal requests and contextual clarifications' },
              ].map(({ from, to, what }) => (
                <div key={`${from}-${to}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: 'var(--de-accent)', whiteSpace: 'nowrap' }}>{from}</span>
                  <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: 'var(--de-text-dim)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--de-accent)', whiteSpace: 'nowrap' }}>{to}:</span>
                  <span style={{ color: 'var(--de-text)' }}>{what}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* System slow vs policy */}
        <section className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">System slow vs. account restricted</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(124,58,237,0.07)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>SYSTEM SLOW MODE</div>
                <p style={{ fontSize: 12, color: 'var(--de-text)', lineHeight: 1.6 }}>
                  IDARi has reduced performance to protect the platform under load.
                  <strong> Not a punishment.</strong> Clears automatically when load drops.
                </p>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.07)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>ACCOUNT RESTRICTED</div>
                <p style={{ fontSize: 12, color: 'var(--de-text)', lineHeight: 1.6 }}>
                  Boogie applied an enforcement action for a policy rule.
                  Includes a rule code, duration, and <Link href="/settings/safety" style={{ color: 'var(--de-accent)' }}>appeal link</Link>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Platform limits */}
        <section className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Platform limits</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)', marginBottom: 8, lineHeight: 1.6 }}>
              These apply consistently to all users. Hitting a limit shows a product constraint message,
              not an accusation.
            </p>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Max Dreams/widgets', '48 per user'],
                  ['Max posts per hour', '30'],
                  ['Max messages per minute', '10'],
                  ['Max share codes per day', '20'],
                ].map(([limit, value]) => (
                  <tr key={limit} style={{ borderTop: '1px solid rgba(160,195,240,0.15)' }}>
                    <td style={{ padding: '6px 8px', color: 'var(--de-text)' }}>{limit}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--de-accent)', fontWeight: 600, textAlign: 'right' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Transparency note */}
        <div className="de-widget">
          <div className="de-widget-header">
            <Info className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">Transparency</span>
          </div>
          <div className="de-widget-body">
            <ul style={{ fontSize: 12, color: 'var(--de-text)', lineHeight: 1.8, paddingLeft: 16, listStyle: 'disc' }}>
              <li>Raw triad logs are never publicly exposed.</li>
              <li>This page describes behavior, not internal telemetry.</li>
              <li>Internal detection methods are never revealed to users.</li>
              <li>Dr. Eams cites event summaries; it never invents explanations.</li>
              <li>Every enforcement action links to the <Link href="/policy" style={{ color: 'var(--de-accent)' }}>public policy page</Link>.</li>
            </ul>
          </div>
        </div>

        {/* Glossary */}
        <section id="glossary" className="de-widget">
          <div className="de-widget-header">
            <BookOpen className="w-4 h-4 mr-2" style={{ color: 'var(--de-accent)' }} />
            <span className="de-widget-title">Glossary</span>
          </div>
          <div className="de-widget-body" style={{ padding: '4px 6px' }}>
            {GLOSSARY.map(({ term, def }) => (
              <div key={term} className="de-row" style={{ borderRadius: 8 }}>
                <div style={{ minWidth: 110 }}>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--de-accent)', background: 'rgba(42,138,184,0.08)', padding: '1px 5px', borderRadius: 4 }}>
                    {term}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--de-text)', lineHeight: 1.5 }}>{def}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Links */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/policy" className="de-btn de-btn-secondary text-xs">
            Safety Policy
          </Link>
          <Link href="/settings/safety" className="de-btn de-btn-secondary text-xs">
            My Safety Log
          </Link>
          <Link href="/settings/safety" className="de-btn de-btn-primary text-xs">
            Submit an Appeal
          </Link>
        </div>

      </div>
    </div>
  );
}
