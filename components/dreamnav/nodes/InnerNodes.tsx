'use client';

import React from 'react';

// ─── Shared primitives ───────────────────────────────────────────────────────

function GlassPanel({
  children,
  gold = false,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  gold?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`de-glass de-rounded ${className}`}
      style={{
        borderColor: gold ? 'var(--de-border-gold)' : undefined,
        boxShadow: gold
          ? '0 0 60px rgba(212,168,67,0.09), 0 2px 32px rgba(0,0,30,0.6)'
          : '0 0 60px rgba(37,99,235,0.08), 0 2px 32px rgba(0,0,30,0.7)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <div className="de-tag">{children}</div>;
}

function Divider({ gold = false }: { gold?: boolean }) {
  return <div className={gold ? 'de-divider de-divider-gold' : 'de-divider'} />;
}

function WidgetTile({
  children,
  span2 = false,
  style = {},
}: {
  children: React.ReactNode;
  span2?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="de-widget-tile"
      style={{ gridColumn: span2 ? 'span 2' : undefined, ...style }}
    >
      {children}
    </div>
  );
}

function StatCard({ value, label, color = 'var(--de-gold)' }: { value: string; label: string; color?: string }) {
  return (
    <div
      style={{
        padding: '14px',
        background: 'var(--de-mist)',
        border: '1px solid var(--de-border)',
        borderRadius: '14px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</div>
      <Tag>{label}</Tag>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: '12px',
        padding: '10px 14px',
        background: 'var(--de-mist)',
        border: '1px solid var(--de-border)',
        borderRadius: '12px',
      }}
    >
      <Tag>{children}</Tag>
    </div>
  );
}

// ─── Track progress bar ───────────────────────────────────────────────────────

function TrackBar({ percent = 42 }: { percent?: number }) {
  return (
    <div
      style={{
        height: '3px',
        background: 'var(--de-border)',
        borderRadius: '2px',
        margin: '8px 0',
        overflow: 'hidden',
      }}
    >
      <div
        className="de-track-fill"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// ─── NODE 1 — FORWARD / EXPLORE ──────────────────────────────────────────────

export function Node1() {
  return (
    <GlassPanel gold style={{ borderRadius: '28px', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <Tag>Inner · Forward</Tag>
          <div className="de-label" style={{ fontSize: '24px', marginTop: '4px' }}>Explore</div>
        </div>
        <div style={{ fontSize: '40px' }}>🌌</div>
      </div>
      <Divider gold />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
        <WidgetTile>
          <Tag>Dream Goals</Tag>
          <div style={{ fontSize: '28px', margin: '8px 0' }}>🚀</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--de-white)' }}>Become Astronaut</div>
        </WidgetTile>
        <WidgetTile>
          <Tag>Dream Goals</Tag>
          <div style={{ fontSize: '28px', margin: '8px 0' }}>🎨</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--de-white)' }}>Master Artist</div>
        </WidgetTile>
        <WidgetTile>
          <Tag>Dream Goals</Tag>
          <div style={{ fontSize: '28px', margin: '8px 0' }}>🌍</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--de-white)' }}>Travel the World</div>
        </WidgetTile>
        <WidgetTile>
          <Tag>Dream Goals</Tag>
          <div style={{ fontSize: '28px', margin: '8px 0' }}>🏆</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--de-white)' }}>Win Trophy</div>
        </WidgetTile>
        <WidgetTile span2>
          <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--de-gold)', fontSize: '14px', fontWeight: 600 }}>
            + Add New Dream Goal
          </div>
        </WidgetTile>
      </div>
      <Hint>Swipe DOWN → Home · Swipe UP again → outer shell 1b</Hint>
    </GlassPanel>
  );
}

// ─── NODE 2 — BACKWARD / ANALYTICS ───────────────────────────────────────────

export function Node2() {
  return (
    <GlassPanel gold style={{ borderRadius: '28px', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <Tag>Inner · Backward</Tag>
          <div className="de-label" style={{ fontSize: '24px', marginTop: '4px' }}>Analytics</div>
        </div>
        <div style={{ fontSize: '40px' }}>📊</div>
      </div>
      <Divider gold />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '16px 0 12px' }}>
        <StatCard value="1.94M" label="Unique Visitors" />
        <StatCard value="$58.2K" label="Revenue" color="var(--de-white)" />
        <StatCard value="58%" label="Time on Platform" color="#22d3ee" />
        <StatCard value="1,246" label="New Signups" color="#34d399" />
      </div>
      <div
        style={{
          background: 'var(--de-mist)',
          border: '1px solid var(--de-border)',
          borderRadius: '14px',
          padding: '12px',
        }}
      >
        <Tag style={{ marginBottom: '8px' }}>Traffic Trend · 30 days</Tag>
        <svg viewBox="0 0 280 60" style={{ width: '100%', height: '60px', display: 'block' }}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#1d4ed8" />
              <stop offset="1" stopColor="#d4a843" />
            </linearGradient>
          </defs>
          <polyline
            points="0,48 28,40 56,44 84,30 112,34 140,18 168,22 196,12 224,16 252,8 280,10"
            fill="none"
            stroke="url(#g1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="0,48 28,40 56,44 84,30 112,34 140,18 168,22 196,12 224,16 252,8 280,10 280,60 0,60"
            fill="url(#g1)"
            opacity="0.08"
          />
        </svg>
      </div>
    </GlassPanel>
  );
}

// ─── NODE 3 — LEFT / MUSIC ────────────────────────────────────────────────────

export function Node3() {
  return (
    <GlassPanel gold style={{ borderRadius: '28px', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <Tag>Inner · Left</Tag>
          <div className="de-label" style={{ fontSize: '24px', marginTop: '4px' }}>Music Studio</div>
        </div>
        <div style={{ fontSize: '40px' }}>🎵</div>
      </div>
      <Divider gold />

      {/* Now playing */}
      <div
        style={{
          background: 'var(--de-mist)',
          border: '1px solid var(--de-border)',
          borderRadius: '14px',
          padding: '14px',
          margin: '16px 0 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg,#1a1a3e,#0d2d8a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              border: '1px solid var(--de-border-gold)',
              flexShrink: 0,
            }}
          >
            🎵
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--de-white)' }}>By Design</div>
            <div style={{ fontSize: '12px', color: 'var(--de-text-dim)' }}>Kid Cudi — Starbound LP</div>
          </div>
          <div style={{ fontSize: '22px', cursor: 'pointer', color: 'var(--de-gold)' }}>▶</div>
        </div>
        <TrackBar percent={42} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--de-text-dim)' }}>
          <span>1:23</span>
          <span>5:38</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <WidgetTile style={{ padding: '10px' }}>
          <Tag>Library</Tag>
          <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px', lineHeight: 1.7, color: 'var(--de-text)' }}>
            Bass · Drums<br />Guitar · Vocals
          </div>
        </WidgetTile>
        <WidgetTile style={{ padding: '10px' }}>
          <Tag>Effects</Tag>
          <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px', lineHeight: 1.7, color: 'var(--de-text)' }}>
            Reverb · Delay<br />Flanger · Chorus
          </div>
        </WidgetTile>
        <WidgetTile style={{ padding: '10px' }}>
          <Tag>Recorder</Tag>
          <div style={{ fontSize: '22px', color: '#ef4444', marginTop: '6px' }}>⏺</div>
          <div style={{ fontSize: '10px', color: 'var(--de-text-dim)', marginTop: '2px' }}>Ready</div>
        </WidgetTile>
      </div>
      <Hint>Swipe LEFT again → outer shell 3b — Code Preview</Hint>
    </GlassPanel>
  );
}

// ─── NODE 4 — RIGHT / CODE ────────────────────────────────────────────────────

export function Node4() {
  return (
    <GlassPanel gold style={{ borderRadius: '28px', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <Tag>Inner · Right</Tag>
          <div className="de-label" style={{ fontSize: '24px', marginTop: '4px' }}>Code Editor</div>
        </div>
        <div style={{ fontSize: '40px' }}>💻</div>
      </div>
      <Divider gold />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', margin: '16px 0 12px' }}>
        <WidgetTile style={{ padding: '10px' }}>
          <Tag>Files</Tag>
          <div style={{ fontSize: '10px', marginTop: '4px', lineHeight: 1.7, color: 'var(--de-text)' }}>
            HeroSection.jsx<br />script.js<br />style.css
          </div>
        </WidgetTile>
        <WidgetTile style={{ padding: '10px' }}>
          <Tag>Snippets</Tag>
          <div style={{ fontSize: '10px', marginTop: '4px', lineHeight: 1.7, color: 'var(--de-text)' }}>
            useEffect Hook<br />API Fetch<br />Custom Hook
          </div>
        </WidgetTile>
        <WidgetTile style={{ padding: '10px' }}>
          <Tag>Linting</Tag>
          <div style={{ fontSize: '10px', marginTop: '4px', lineHeight: 1.7, color: 'var(--de-text)' }}>
            ESLint ✓<br />Prettier ✓<br />3 warnings
          </div>
        </WidgetTile>
      </div>

      <div
        className="de-code"
        style={{
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid var(--de-border)',
          borderRadius: '14px',
          padding: '14px',
          color: '#7dd3fc',
          overflowX: 'auto',
          marginBottom: '12px',
        }}
      >
        <div style={{ color: 'var(--de-text-dim)', marginBottom: '4px', fontSize: '10px' }}>
          HeroSection.jsx · line 12
        </div>
        <span style={{ color: '#94a3b8' }}>const </span>
        <span style={{ color: '#67e8f9' }}>DreamSurface</span>
        <span style={{ color: '#94a3b8' }}> = () =&gt; {'{'}</span>
        <br />
        <span style={{ paddingLeft: '14px', color: '#94a3b8' }}>const </span>
        <span style={{ color: '#f0a500' }}>{'{node}'}</span>
        <span style={{ color: '#94a3b8' }}> = useDreamNav();</span>
        <br />
        <span style={{ paddingLeft: '14px', color: '#94a3b8' }}>return </span>
        <span style={{ color: '#67e8f9' }}>&lt;Surface</span>
        <span style={{ color: '#f0a500' }}> node</span>
        <span style={{ color: '#94a3b8' }}>={'{node}'}/&gt;;</span>
        <br />
        <span style={{ color: '#94a3b8' }}>{'}'}</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span className="de-stat-pill">Terminal</span>
        <span className="de-stat-pill">Git · 189 commits</span>
        <span className="de-stat-pill" style={{ color: 'var(--de-gold)', borderColor: 'var(--de-border-gold)' }}>
          Tests ✓
        </span>
      </div>
    </GlassPanel>
  );
}

// ─── NODE 5 — DEPTH IN ────────────────────────────────────────────────────────

export function Node5() {
  return (
    <div
      className="de-glass de-rounded"
      style={{ padding: '24px', background: 'rgba(3,8,30,0.88)', borderRadius: '28px' }}
    >
      <div style={{ textAlign: 'center', padding: '18px 0 14px' }}>
        <div style={{ fontSize: '52px', marginBottom: '10px' }}>◎</div>
        <Tag>Depth Inner · Node 5</Tag>
        <div className="de-label" style={{ fontSize: '22px', marginTop: '6px' }}>Inner Core</div>
        <div style={{ fontSize: '13px', color: 'var(--de-text-dim)', marginTop: '8px', lineHeight: 1.6 }}>
          You have gone deeper into the system.<br />Pinch out to return Home.
        </div>
      </div>
      <Divider />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
        <WidgetTile style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', margin: '4px 0' }}>⚙️</div>
          <Tag>System Core</Tag>
        </WidgetTile>
        <WidgetTile style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', margin: '4px 0' }}>🔐</div>
          <Tag>Permissions</Tag>
        </WidgetTile>
        <WidgetTile style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', margin: '4px 0' }}>📡</div>
          <Tag>Connections</Tag>
        </WidgetTile>
        <WidgetTile style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', margin: '4px 0' }}>⬡</div>
          <Tag>Dream Grid</Tag>
        </WidgetTile>
      </div>
    </div>
  );
}

// ─── NODE 6 — DEPTH OUT ───────────────────────────────────────────────────────

export function Node6() {
  const outerNodes = [
    { id: '1b', icon: '🎵', label: 'Music' },
    { id: '2b', icon: '🔬', label: 'Lab' },
    { id: '3b', icon: '💻', label: 'Code' },
    { id: '4b', icon: '✦', label: 'Brand' },
    { id: '5b', icon: '🎮', label: 'Games' },
    { id: '6b', icon: '⬡', label: 'Create' },
  ];

  return (
    <div className="de-outer-shell">
      <div style={{ textAlign: 'center', padding: '14px 0 18px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>✦</div>
        <Tag>Depth Outer · Node 6</Tag>
        <div className="de-label" style={{ fontSize: '22px', marginTop: '6px' }}>Dream Layer</div>
        <div style={{ fontSize: '13px', color: 'var(--de-text-dim)', marginTop: '8px', lineHeight: 1.6 }}>
          The outer shell of the spatial system.<br />Pinch in to return Home.
        </div>
      </div>
      <Divider gold />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginTop: '16px' }}>
        {outerNodes.map((n) => (
          <div key={n.id} className="de-widget-tile" style={{ textAlign: 'center', padding: '12px 8px' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{n.icon}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--de-gold)' }}>
              {n.id} {n.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
