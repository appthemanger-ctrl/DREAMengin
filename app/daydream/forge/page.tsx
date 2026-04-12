import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Flame, Zap, Layers, Activity, TrendingUp } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';
import ForgeEngin from '@/engins/ForgeEngin';
import ForgeMomentumWidget from '@/components/forge/ForgeMomentumWidget';
import AuthenticatedPageHeader from '@/components/ui/AuthenticatedPageHeader';
import { CREATIVE_ENGINES } from '@/lib/forge/forgeRegistry';
import { connection } from 'next/server';

export const metadata = {
  title: 'Forge Daydream – DREAMengin',
  description: 'Orchestrate all engines from one meta-creation surface.',
};

const WIDGETS: DaydreamWidget[] = [
  { id: 'status-matrix', emoji: '📊', label: 'Status Matrix', desc: 'Live heat map of every engine', color: '#ef4444' },
  { id: 'cross-link',    emoji: '🔗', label: 'Cross-Engine',  desc: 'View engine linkages',         color: '#a855f7' },
  { id: 'games',         emoji: '🎮', label: 'GameEngin',     desc: 'Jump to games',                color: '#c8981a', href: '/daydream/games' },
  { id: 'music',         emoji: '🎵', label: 'StarMaker',     desc: 'Jump to music',                color: '#a855f7', href: '/daydream/music' },
  { id: 'code',          emoji: '💻', label: 'CodeEngin',     desc: 'Jump to code',                 color: '#22d3ee', href: '/daydream/code' },
  { id: 'lab',           emoji: '🔬', label: 'LabEngin',      desc: 'Jump to lab',                  color: '#10b981', href: '/daydream/lab' },
];

export default async function ForgeDaydreamPage() {
  await connection();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <DaydreamShell
      title="Forge"
      enginName="ForgeEngin"
      accentColor="#ef4444"
      daydreamType="forge"
      widgets={WIDGETS}
      sideBComponent={ForgeEngin}
    >
      <div className="de-sky-bg min-h-screen">
        <AuthenticatedPageHeader
          backHref="/homedream"
          title="Forge"
          subtitle="Orchestrate all engines from one meta-creation surface."
          icon={<Flame className="w-4 h-4" />}
          accentColor="#ef4444"
          badge="Forge Daydream + ForgeEngin"
          containerClassName="max-w-5xl"
        />

        <div className="de-auth-content space-y-4">
          {/* Hero card */}
          <div className="de-auth-hero">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.56)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.18)' }}>
                <Flame className="w-3.5 h-3.5" />
                Meta-creation engine — orchestrate, don&apos;t replace
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--de-heading)', lineHeight: 1.05, marginTop: 12 }}>
                One surface to see
                <br />
                every engine&apos;s pulse.
              </h2>
              <p style={{ fontSize: 13, color: 'var(--de-text-dim)', lineHeight: 1.7, maxWidth: 600, marginTop: 10 }}>
                The Forge doesn&apos;t replace any engine. It watches all of them — activity heat, last actions, cross-engine data flows — and gives you a single command surface to orchestrate your creative workflow.
              </p>
            </div>
          </div>

          {/* Momentum Widget */}
          <div className="de-widget">
            <div className="de-widget-header">
              <TrendingUp className="w-4 h-4" style={{ color: '#ef4444' }} />
              <span className="de-widget-title ml-2">Creative Momentum</span>
            </div>
            <div className="de-widget-body" style={{ paddingTop: 12 }}>
              <ForgeMomentumWidget />
            </div>
          </div>

          {/* Engine Quick Cards */}
          <div className="de-widget">
            <div className="de-widget-header">
              <Activity className="w-4 h-4" style={{ color: '#ef4444' }} />
              <span className="de-widget-title ml-2">Engine Overview</span>
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                {CREATIVE_ENGINES.length} engines
              </span>
            </div>
            <div className="de-widget-body" style={{ paddingTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {CREATIVE_ENGINES.map(engine => (
                  <Link
                    key={engine.id}
                    href={engine.daydreamHref}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 14px',
                      borderRadius: 14,
                      textDecoration: 'none',
                      background: 'rgba(255,255,255,0.48)',
                      border: `1px solid ${engine.accent}20`,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <span style={{
                      width: 36, height: 36, borderRadius: 10,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: `${engine.accent}12`, fontSize: 18,
                    }}>
                      {engine.emoji}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{engine.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{engine.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Cross-engine concept */}
          <div className="de-widget">
            <div className="de-widget-header">
              <Zap className="w-4 h-4" style={{ color: '#a855f7' }} />
              <span className="de-widget-title ml-2">Cross-Engine Thinking</span>
            </div>
            <div className="de-widget-body" style={{ display: 'grid', gap: 10 }}>
              <div style={{ borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.44)', border: '1px solid rgba(168,85,247,0.18)' }}>
                <div style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--de-text-dim)' }}>
                  In DREAMengin, engines aren&apos;t isolated apps — they&apos;re facets of a single creative environment. Music flows into games. Code powers lab experiments. Brand identity shapes content. The Forge makes these connections visible.
                </div>
              </div>
            </div>
          </div>

          {/* System architecture */}
          <div className="de-widget">
            <div className="de-widget-header">
              <Layers className="w-4 h-4" style={{ color: '#c8981a' }} />
              <span className="de-widget-title ml-2">Architecture</span>
            </div>
            <div className="de-widget-body" style={{ display: 'grid', gap: 10 }}>
              {[
                { title: 'Forge Daydream', tone: '#ef4444', detail: 'The calm overview surface. See every engine at a glance, browse cross-engine linkages.' },
                { title: 'ForgeEngin', tone: '#c8981a', detail: 'Side B runtime. Live heat map, activity pulses, one-tap launch into any engine.' },
                { title: 'Activity Pulse', tone: '#22c55e', detail: 'Every engine action is timestamped. Heat decays over 30 minutes, giving you a real-time feel for momentum.' },
              ].map(item => (
                <div key={item.title} style={{ borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.44)', border: `1px solid ${item.tone}26` }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: item.tone, marginBottom: 6 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--de-text-dim)' }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DaydreamShell>
  );
}
