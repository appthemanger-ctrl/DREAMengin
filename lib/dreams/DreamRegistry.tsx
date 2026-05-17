import React from 'react';

export type RegisteredDreamComponent = React.ComponentType<{
  dreamId: string;
  title?: string;
  state?: Record<string, unknown>;
  open?: (href: string, title?: string) => void;
}>;

function DreamRegistryCard() {
  dreamId,
  title,
  state,
  open,
}: {
  dreamId: string;
  title?: string;
  state?: Record<string, unknown>;
  open?: (href: string, title?: string) => void;
}) {
  const route = typeof state?.route === 'string' ? state.route : `/dreams/${dreamId}`;
  return (
    <div className="de-glass" style={{ borderRadius: 28, padding: 32, maxWidth: 600, textAlign: 'center' }}>
      <div className="de-tag">Dream</div>
      <div className="de-label" style={{ fontSize: 24, marginTop: 8 }}>{title ?? `Dream ${dreamId}`}</div>
      <p style={{ color: 'var(--de-text-dim)', marginTop: 12, fontSize: 13 }}>
        This Dream was instantiated from the shared DreamRegistry.
      </p>
      <button
        type="button"
        onClick={() => open?.(route, title ?? `Dream ${dreamId}`)}
        style={{
          display: 'inline-block',
          marginTop: 16,
          padding: '10px 24px',
          background: 'linear-gradient(135deg,#c8981a,#e0b830)',
          color: '#fff',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 13,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Open Dream →
      </button>
    </div>
  );
}

function QuickNoteDream(props: React.ComponentProps<typeof DreamRegistryCard>) {
  return (
    <div className="de-glass" style={{ borderRadius: 28, padding: 24, maxWidth: 520 }}>
      <div className="de-tag">Quick Note</div>
      <textarea
        aria-label="Quick Note"
        placeholder="Write the thought before it fades…"
        style={{
          width: '100%',
          minHeight: 180,
          marginTop: 12,
          borderRadius: 18,
          border: '1px solid rgba(160,195,240,0.22)',
          background: 'rgba(255,255,255,0.72)',
          padding: 14,
          resize: 'vertical',
          color: 'var(--de-heading)',
        }}
        defaultValue={typeof props.state?.text === 'string' ? props.state.text : ''}
      />
    </div>
  );
}

function TodayStatsDream() {
  return (
    <div className="de-glass" style={{ borderRadius: 28, padding: 28, maxWidth: 520, textAlign: 'center' }}>
      <div className="de-tag">Today’s Stats</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
        {[
          ['Dreams', '3'],
          ['Moves', '∞'],
          ['Flow', 'SICC'],
        ].map(([label, value]) => (
          <div key={label} style={{ borderRadius: 18, background: 'rgba(200,152,26,0.10)', padding: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--de-heading)' }}>{value}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--de-text-dim)', textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GameQuickLaunchDream() { open }: React.ComponentProps<typeof DreamRegistryCard> {
  return (
    <DreamRegistryCard
      dreamId="dreamspace-game-quick-launch"
      title="Game Quick Launch"
      state={{ route: '/daydream/games' }}
      open={open}
    />
  );
}

export const DreamRegistry: Record<string, RegisteredDreamComponent> = {
  default: DreamRegistryCard,
  'dreamspace-quick-note': QuickNoteDream,
  'dreamspace-todays-stats': TodayStatsDream,
  'dreamspace-game-quick-launch': GameQuickLaunchDream,
  'flagship-engins': DreamRegistryCard,
  feed: DreamRegistryCard,
};

export function getDreamComponent(type?: string: RegisteredDreamComponent) {
  return (type && DreamRegistry[type]) || DreamRegistry.default;
}
