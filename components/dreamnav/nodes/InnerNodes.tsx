'use client';

import React from 'react';

// ---- Shared Primitives (theme-aware) ----

function GlassPanel({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`de-glass de-rounded ${className}`}
      style={{
        boxShadow: '0 4px 30px rgba(0,0,0,0.08)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Tag({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="de-tag" style={{ color: 'var(--de-text-dim)', ...style }}>{children}</div>;
}

function Divider() {
  return <div className="de-divider de-divider-gold" />;
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
      <div className="de-track-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

function NodeFooter() {
  return (
    <div className="flex justify-center" style={{ padding: '16px 0 4px' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/dreamengin-logo.jpg"
        alt="Dreamengin"
      />
    </div>
  );
}

// ---- NODE 1 -- EXPLORE / HOME FEED ----

export function Node1() {
  const feedPosts = [
    { platform: 'Twitter', user: 'twitter', time: '1 day ago', text: 'Dream big, work hard, and make it happen! #MotivationDay', verified: true },
    { platform: 'Reddit', user: 'Gaming', time: '1 hour ago', text: "Immersed in the latest fantasy VR game. It's breathtaking!", verified: true },
    { platform: 'Instagram', user: '@iriconcepts3d', time: '2 hours ago', text: 'In the zone creating some new 3D concepts!', verified: false },
  ];

  return (
    <GlassPanel style={{ borderRadius: '28px', padding: '24px' }}>
      {/* Social platform header chips */}
      <div className="flex gap-2" style={{ marginBottom: 14, overflowX: 'auto' }}>
        {['Instagram', 'Facebook', 'Twitter', 'TikTok'].map((p) => (
          <div key={p} className="de-widget-tile" style={{ padding: '10px 16px', minWidth: 'fit-content', flex: '1 0 auto' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{p}</div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 2 }}>
              {p === 'Twitter' ? '#SpaceExploration' : p === 'TikTok' ? 'Trending' : p === 'Facebook' ? 'Online now' : '@lucy_with'}
            </div>
          </div>
        ))}
      </div>

      {/* Home Feed */}
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)', textAlign: 'center', marginBottom: 14 }}>
        Home Feed
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {feedPosts.map((post, i) => (
          <div key={i} className="de-widget-tile" style={{ padding: 14 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: post.platform === 'Reddit' ? '#FF4500' : post.platform === 'Twitter' ? '#1DA1F2' : 'linear-gradient(135deg, #833AB4, #FD1D1D, #FCAF45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: 'white', fontWeight: 700,
                }}
              >
                {post.platform[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>
                  {post.platform} {post.verified && <span style={{ color: 'var(--de-accent)' }}>*</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{post.time}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--de-text)', lineHeight: 1.5 }}>{post.text}</div>
          </div>
        ))}
      </div>

      {/* Bottom widget row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 14 }}>
        {[
          { label: 'YouTube', sub: 'Playlist' },
          { label: 'Spotify', sub: 'Now Playing' },
          { label: 'Weather', sub: '56 Mostly Cleary' },
          { label: 'Portfolio', sub: 'Updates' },
        ].map((w) => (
          <div key={w.label} className="de-widget-tile" style={{ padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{w.label}</div>
            <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginTop: 4 }}>{w.sub}</div>
          </div>
        ))}
      </div>

      <NodeFooter />
    </GlassPanel>
  );
}

// ---- NODE 2 -- ANALYTICS ----

export function Node2() {
  return (
    <GlassPanel style={{ borderRadius: '28px', padding: '24px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
        <div>
          <Tag>Analytics</Tag>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: 'var(--de-heading)' }}>Overview</div>
        </div>
        <span
          style={{
            padding: '4px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700,
            background: 'var(--de-gold)', color: 'white',
          }}
        >
          PREMIUM
        </span>
      </div>
      <Divider />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', margin: '16px 0 12px' }}>
        <StatCard value="1.94M" label="Viewport" />
        <StatCard value="$58%" label="Each 14.5x" color="var(--de-heading)" />
        <StatCard value="$58.2K" label="Traffic" color="var(--de-accent)" />
        <StatCard value="1,246" label="Sign Rate" color="#34d399" />
      </div>

      {/* Traffic chart */}
      <div style={{ background: 'var(--de-mist)', border: '1px solid var(--de-border)', borderRadius: '14px', padding: '12px', marginBottom: 12 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
          <Tag>Traffic Trend - 30 days</Tag>
          <span style={{ fontSize: 11, color: 'var(--de-accent)', fontWeight: 600, cursor: 'pointer' }}>Reports &gt;</span>
        </div>
        <svg viewBox="0 0 280 60" style={{ width: '100%', height: '60px', display: 'block' }}>
          <defs>
            <linearGradient id="g1-ice" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--de-accent)" />
              <stop offset="1" stopColor="var(--de-gold)" />
            </linearGradient>
          </defs>
          <polyline
            points="0,48 28,40 56,44 84,30 112,34 140,18 168,22 196,12 224,16 252,8 280,10"
            fill="none" stroke="url(#g1-ice)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          />
          <polyline
            points="0,48 28,40 56,44 84,30 112,34 140,18 168,22 196,12 224,16 252,8 280,10 280,60 0,60"
            fill="url(#g1-ice)" opacity="0.10"
          />
        </svg>
        <div className="flex gap-2" style={{ marginTop: 8 }}>
          {['Last 30 Days', 'Week', 'Month', 'Years'].map((f) => (
            <span key={f} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text-dim)' }}>{f}</span>
          ))}
        </div>
      </div>

      {/* Traffic & Revenue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="de-widget-tile" style={{ padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 8 }}>Traffic</div>
          <div className="flex gap-3">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-gold)' }}>ORGANIC</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)' }}>441%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-accent)' }}>$539K</div>
              <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>Sor Flooners</div>
            </div>
          </div>
        </div>
        <div className="de-widget-tile" style={{ padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 8 }}>Revenue</div>
          <div className="flex gap-3">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-accent)' }}>SOCIAL</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)' }}>32%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-gold)' }}>Paid</div>
              <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>Traffic</div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue bars */}
      <div className="de-widget-tile" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 10 }}>Revenue</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            { v: '878.6K', sub: '909.5k', c: 'var(--de-accent)' },
            { v: '66.5K', sub: '', c: 'var(--de-heading)' },
            { v: '65.8K', sub: '5.6%', c: 'var(--de-gold)' },
            { v: '+1124%', sub: '', c: '#34d399' },
          ].map((r, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ height: 40, background: r.c, opacity: 0.2, borderRadius: 6, marginBottom: 6 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: r.c }}>{r.v}</div>
              {r.sub && <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{r.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
        {['Capture', 'Overview', 'Traffic', 'Revenue', 'Growth', 'Insights'].map((tab) => (
          <div key={tab} className="de-widget-tile" style={{ textAlign: 'center', padding: '8px 4px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-heading)' }}>{tab}</div>
          </div>
        ))}
      </div>

      <NodeFooter />
    </GlassPanel>
  );
}

// ---- NODE 3 -- MUSIC STUDIO ----

export function Node3() {
  return (
    <GlassPanel style={{ borderRadius: '28px', padding: '24px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
        <div>
          <Tag>Music Studio</Tag>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: 'var(--de-heading)' }}>ATOM Records</div>
        </div>
      </div>
      <Divider />

      {/* Album header */}
      <div className="de-widget-tile" style={{ padding: 14, marginTop: 14, marginBottom: 12 }}>
        <div className="flex gap-3 items-center">
          <div
            style={{
              width: 56, height: 56, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--de-accent), var(--de-gold))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, color: 'white', fontWeight: 700, flexShrink: 0,
            }}
          >
            C
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)' }}>Cosmic Vibes EP</div>
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>Feb 13, 2023 - 1 tUno</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap" style={{ marginTop: 10 }}>
          {['Hance', 'Serenames', 'Serba Races', 'Sens nos', 'BG Tavet'].map((tag) => (
            <span key={tag} style={{
              padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 600,
              background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text-dim)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Playlist Manager */}
      <div className="de-widget-tile" style={{ padding: 14, marginBottom: 12 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)' }}>Playlist Manager</div>
          <div className="flex gap-2">
            <span style={{ fontSize: 11, color: 'var(--de-accent)' }}>Coroq</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 8 }}>
          Beat parte Being Fnags - Sort tq. Rago
        </div>
        {[
          { name: 'Artner to Orine', dur: '11 fn' },
          { name: 'Celestial Voyage', dur: '21 B' },
          { name: 'Cranby Nught', dur: '21 B' },
          { name: 'DJ Luna', dur: '81 B' },
          { name: 'Into the Unknown', dur: '61 B' },
        ].map((track) => (
          <div key={track.name} className="flex justify-between items-center" style={{ padding: '6px 0', borderBottom: '1px solid var(--de-border)' }}>
            <div className="flex items-center gap-2">
              <div style={{ width: 14, height: 14, borderRadius: 3, border: '1.5px solid var(--de-border)' }} />
              <span style={{ fontSize: 12, color: 'var(--de-text)' }}>{track.name}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{track.dur}</span>
          </div>
        ))}
      </div>

      {/* Sound Recorder */}
      <div className="de-widget-tile" style={{ padding: 14 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)' }}>Sound Recorder</div>
          <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Sany laco</span>
        </div>
        <div className="flex gap-2 flex-wrap" style={{ marginBottom: 8 }}>
          {['1.68096', 'Soma9', 'S00198', 'Sa003'].map((tag) => (
            <span key={tag} style={{
              padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 600,
              background: tag === 'S00198' ? 'rgba(42,138,184,0.15)' : 'var(--de-mist)',
              border: `1px solid ${tag === 'S00198' ? 'var(--de-accent)' : 'var(--de-border)'}`,
              color: tag === 'S00198' ? 'var(--de-accent)' : 'var(--de-text-dim)',
            }}>
              {tag}
            </span>
          ))}
        </div>
        {/* Waveform placeholder */}
        <div style={{ height: 40, borderRadius: 8, background: 'var(--de-mist)', border: '1px solid var(--de-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="flex gap-1 items-end" style={{ height: 24 }}>
            {[12, 20, 8, 24, 16, 22, 10, 18, 14, 24, 20, 12, 16, 22, 8].map((h, i) => (
              <div key={i} style={{ width: 3, height: h, background: 'var(--de-accent)', borderRadius: 2, opacity: 0.6 }} />
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center" style={{ marginTop: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)' }}>PLAYBACK</span>
          <span style={{ fontSize: 11, color: 'var(--de-gold)' }}>Mixing/Academic Voyage - $18.99</span>
        </div>
      </div>

      <NodeFooter />
    </GlassPanel>
  );
}

// ---- NODE 4 -- CODE EDITOR ----

export function Node4() {
  return (
    <GlassPanel style={{ borderRadius: '28px', padding: '24px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
        <div>
          <Tag>Inner - Right</Tag>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: 'var(--de-heading)' }}>Code Editor</div>
        </div>
      </div>
      <Divider />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', margin: '14px 0 12px' }}>
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
            {'ESLint \u2713'}<br />{'Prettier \u2713'}<br />3 warnings
          </div>
        </WidgetTile>
      </div>

      {/* Code block - always dark for readability */}
      <div
        className="de-code"
        style={{
          background: 'rgba(15,20,40,0.92)',
          border: '1px solid var(--de-border)',
          borderRadius: '14px',
          padding: '14px',
          color: '#7dd3fc',
          overflowX: 'auto',
          marginBottom: '12px',
        }}
      >
        <div style={{ color: '#94a3b8', marginBottom: '4px', fontSize: '10px' }}>
          HeroSection.jsx - line 12
        </div>
        <span style={{ color: '#94a3b8' }}>{'const '}</span>
        <span style={{ color: '#67e8f9' }}>DreamSurface</span>
        <span style={{ color: '#94a3b8' }}>{' = () => {'}</span>
        <br />
        <span style={{ paddingLeft: '14px', color: '#94a3b8' }}>{'const '}</span>
        <span style={{ color: '#f0a500' }}>{'{node}'}</span>
        <span style={{ color: '#94a3b8' }}>{' = useDreamNav();'}</span>
        <br />
        <span style={{ paddingLeft: '14px', color: '#94a3b8' }}>{'return '}</span>
        <span style={{ color: '#67e8f9' }}>{'<Surface'}</span>
        <span style={{ color: '#f0a500' }}>{' node'}</span>
        <span style={{ color: '#94a3b8' }}>{'={node}/>;'}</span>
        <br />
        <span style={{ color: '#94a3b8' }}>{'}'}</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span className="de-stat-pill" style={{ color: 'var(--de-text-dim)' }}>Terminal</span>
        <span className="de-stat-pill" style={{ color: 'var(--de-text-dim)' }}>Git - 189 commits</span>
        <span className="de-stat-pill" style={{ color: 'var(--de-gold)', borderColor: 'var(--de-border-gold)' }}>
          {'Tests \u2713'}
        </span>
      </div>

      <NodeFooter />
    </GlassPanel>
  );
}

// ---- NODE 5 -- INNER CORE ----

export function Node5() {
  return (
    <GlassPanel style={{ padding: '24px', borderRadius: '28px' }}>
      <div style={{ textAlign: 'center', padding: '18px 0 14px' }}>
        <div style={{ fontSize: '52px', marginBottom: '10px', color: 'var(--de-gold)' }}>*</div>
        <Tag>Depth Inner - Node 5</Tag>
        <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '6px', color: 'var(--de-heading)' }}>Inner Core</div>
        <div style={{ fontSize: '13px', color: 'var(--de-text-dim)', marginTop: '8px', lineHeight: 1.6 }}>
          You have gone deeper into the system.<br />Pinch out to return Home.
        </div>
      </div>
      <Divider />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
        {[
          { label: 'System Core', icon: 'gear' },
          { label: 'Permissions', icon: 'lock' },
          { label: 'Connections', icon: 'signal' },
          { label: 'Dream Grid', icon: 'grid' },
        ].map((item) => (
          <WidgetTile key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', margin: '4px 0', color: 'var(--de-gold)' }}>
              {item.icon === 'gear' ? '\u2699' : item.icon === 'lock' ? '\u{1F512}' : item.icon === 'signal' ? '\u{1F4E1}' : '\u2B21'}
            </div>
            <Tag>{item.label}</Tag>
          </WidgetTile>
        ))}
      </div>
      <NodeFooter />
    </GlassPanel>
  );
}

// ---- NODE 6 -- DREAM LAYER (outer launcher) ----

export function Node6() {
  const outerNodes = [
    { id: '1b', label: 'Music', icon: '\u{1F3B5}' },
    { id: '2b', label: 'Lab', icon: '\u{1F52C}' },
    { id: '3b', label: 'Code', icon: '\u{1F4BB}' },
    { id: '4b', label: 'Brand', icon: '\u2726' },
    { id: '5b', label: 'Games', icon: '\u{1F3AE}' },
    { id: '6b', label: 'Create', icon: '\u2B21' },
  ];

  return (
    <GlassPanel style={{ padding: '24px', borderRadius: '28px' }}>
      <div style={{ textAlign: 'center', padding: '14px 0 18px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px', color: 'var(--de-gold)' }}>{'\u2726'}</div>
        <Tag>Depth Outer - Node 6</Tag>
        <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '6px', color: 'var(--de-heading)' }}>Dream Layer</div>
        <div style={{ fontSize: '13px', color: 'var(--de-text-dim)', marginTop: '8px', lineHeight: 1.6 }}>
          The outer shell of the spatial system.<br />Pinch in to return Home.
        </div>
      </div>
      <Divider />
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
      <NodeFooter />
    </GlassPanel>
  );
}
