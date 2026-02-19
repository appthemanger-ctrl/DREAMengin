'use client';

import React from 'react';

// ─── Shared primitives ────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
  return <div className="de-tag">{children}</div>;
}

function Divider() {
  return <div className="de-divider de-divider-gold" style={{ margin: '14px 0' }} />;
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

function InnerPanel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--de-mist)',
        border: '1px solid var(--de-border-gold)',
        borderRadius: '14px',
        padding: '14px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function OuterShell({ children }: { children: React.ReactNode }) {
  return <div className="de-outer-shell">{children}</div>;
}

function Header({ icon, tag, title }: { icon: string; tag: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <div>
        <Tag>{tag}</Tag>
        <div className="de-label" style={{ fontSize: '24px', marginTop: '4px' }}>{title}</div>
      </div>
      <div style={{ fontSize: '40px' }}>{icon}</div>
    </div>
  );
}

// ─── NODE 1b — MUSIC RELEASES ─────────────────────────────────────────────────

export function Node1b() {
  return (
    <OuterShell>
      <Header icon="🌌" tag="Day Dream · 1b" title="Music Releases" />
      <Divider />
      <InnerPanel style={{ marginBottom: '12px' }}>
        <Tag>Release Manager</Tag>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '10px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg,#1a1a3e,#0d2d8a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              border: '1px solid var(--de-border-gold)',
              flexShrink: 0,
            }}
          >
            🎵
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--de-white)' }}>Starbound</div>
            <div style={{ fontSize: '12px', color: 'var(--de-text-dim)' }}>Release: 05.30.2022</div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span className="de-badge" style={{ fontSize: '8px' }}>165 Streams</span>
              <span className="de-badge" style={{ fontSize: '8px' }}>+100.195</span>
            </div>
          </div>
        </div>
      </InnerPanel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <WidgetTile style={{ padding: '10px' }}>
          <Tag>Distribution</Tag>
          <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--de-gold)', lineHeight: 1.7 }}>
            Single $0.99<br />Album $9.99
          </div>
        </WidgetTile>
        <WidgetTile style={{ padding: '10px' }}>
          <Tag>Social Push</Tag>
          <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--de-text)', lineHeight: 1.7 }}>
            Instagram<br />Facebook
          </div>
        </WidgetTile>
        <WidgetTile style={{ padding: '10px' }}>
          <Tag>Storefront</Tag>
          <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--de-text)', lineHeight: 1.7 }}>
            Total Album<br />Last Dreamscape
          </div>
        </WidgetTile>
      </div>
    </OuterShell>
  );
}

// ─── NODE 2b — LAB ───────────────────────────────────────────────────────────

export function Node2b() {
  return (
    <OuterShell>
      <Header icon="🔬" tag="Day Dream · 2b" title="Lab" />
      <Divider />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <WidgetTile>
          <Tag>Equipment</Tag>
          <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--de-text)', lineHeight: 1.7 }}>
            Centrifuge<br />Incubator<br />PCR Machine
          </div>
        </WidgetTile>
        <WidgetTile>
          <Tag>Tasks</Tag>
          <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--de-text)', lineHeight: 1.7 }}>
            Video Edits<br />Blog Content<br />Promo Banners
          </div>
        </WidgetTile>
        <WidgetTile span2>
          <Tag>Lab Monitor</Tag>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px',
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--de-gold)' }}>9.6%</div>
              <Tag>Protein Syn.</Tag>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#22d3ee' }}>75%</div>
              <Tag>Fluid Analysis</Tag>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#34d399' }}>4%</div>
              <Tag>DNA Amp.</Tag>
            </div>
          </div>
        </WidgetTile>
      </div>
    </OuterShell>
  );
}

// ─── NODE 3b — CODE PREVIEW ───────────────────────────────────────────────────

export function Node3b() {
  return (
    <OuterShell>
      <Header icon="💻" tag="Day Dream · 3b" title="Code · Preview" />
      <Divider />
      <div
        style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid var(--de-border-gold)',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span
            className="de-tag"
            style={{
              padding: '3px 10px',
              background: 'rgba(37,99,235,0.2)',
              border: '1px solid rgba(37,99,235,0.35)',
              borderRadius: '100px',
              color: '#93c5fd',
            }}
          >
            Device: iPhone 14 Pro
          </span>
          <span
            className="de-tag"
            style={{
              padding: '3px 10px',
              background: 'rgba(212,168,67,0.1)',
              border: '1px solid var(--de-border-gold)',
              borderRadius: '100px',
              color: 'var(--de-gold)',
            }}
          >
            58 FPS
          </span>
        </div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            textAlign: 'center',
            padding: '16px',
            background: 'rgba(0,20,80,0.4)',
            borderRadius: '10px',
            color: 'var(--de-white)',
          }}
        >
          DreamVerse —{' '}
          <span style={{ color: 'var(--de-gold)' }}>Explore the Universe of the Future</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <WidgetTile style={{ padding: '10px' }}>
          <Tag>Terminal</Tag>
          <div className="de-code" style={{ marginTop: '4px', color: 'var(--de-text)' }}>
            npm run build
          </div>
        </WidgetTile>
        <WidgetTile style={{ padding: '10px' }}>
          <Tag>Git</Tag>
          <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--de-gold)', fontWeight: 600 }}>
            189 commits
          </div>
        </WidgetTile>
        <WidgetTile style={{ padding: '10px' }}>
          <Tag>Tests</Tag>
          <div style={{ fontSize: '12px', marginTop: '4px', color: '#34d399', fontWeight: 600 }}>
            All passing ✓
          </div>
        </WidgetTile>
      </div>
    </OuterShell>
  );
}

// ─── NODE 4b — BRAND ─────────────────────────────────────────────────────────

export function Node4b() {
  return (
    <OuterShell>
      <Header icon="✦" tag="Day Dream · 4b" title="Brand" />
      <Divider />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div
          style={{
            background: 'var(--de-mist)',
            border: '1px solid var(--de-border-gold)',
            borderRadius: '14px',
            padding: '14px',
          }}
        >
          <Tag>DreamVerse</Tag>
          <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '4px', color: 'var(--de-white)' }}>
            @DreamVerseHQ
          </div>
          <div style={{ fontSize: '12px', color: 'var(--de-text-dim)' }}>1.2M Followers</div>
        </div>
        <div
          style={{
            background: 'var(--de-mist)',
            border: '1px solid var(--de-border)',
            borderRadius: '14px',
            padding: '14px',
          }}
        >
          <Tag>Ad Campaigns</Tag>
          <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--de-text)', lineHeight: 1.7 }}>
            Instagram<br />Blog Content<br />Promo Banners
          </div>
        </div>
        <WidgetTile span2>
          <Tag>Overview</Tag>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--de-gold)' }}>$8.2K</div>
              <Tag>Monthly Rev.</Tag>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--de-white)' }}>41%</div>
              <Tag>Organic</Tag>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#22d3ee' }}>3.4%</div>
              <Tag>Conversion</Tag>
            </div>
          </div>
        </WidgetTile>
      </div>
    </OuterShell>
  );
}

// ─── NODE 5b — GAMES ─────────────────────────────────────────────────────────

export function Node5b() {
  return (
    <OuterShell>
      <Header icon="🎮" tag="Day Dream · 5b" title="Games" />
      <Divider />
      <InnerPanel style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '22px' }}>🏎</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--de-white)' }}>Night Drive</div>
            <div style={{ fontSize: '12px', color: 'var(--de-gold)' }}>LAP 2/3 · 2nd of 8</div>
          </div>
          <span className="de-badge" style={{ marginLeft: 'auto' }}>82 FPS</span>
        </div>
        <div
          style={{
            height: '8px',
            background: 'var(--de-mist)',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid var(--de-border)',
          }}
        >
          <div
            style={{
              width: '65%',
              height: '100%',
              background: 'linear-gradient(90deg,var(--de-accent),var(--de-gold))',
              borderRadius: '4px',
            }}
          />
        </div>
      </InnerPanel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <WidgetTile>
          <Tag>Friends Online</Tag>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--de-white)' }}>
            8 friends active
          </div>
        </WidgetTile>
        <WidgetTile>
          <Tag>Achievements</Tag>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--de-gold)' }}>
            Night Drive ✓
          </div>
        </WidgetTile>
        <WidgetTile span2>
          <Tag>My Library</Tag>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span className="de-badge">Cosmic Adventure</span>
            <span className="de-badge">Dream Valley</span>
            <span className="de-badge">Apex</span>
            <span className="de-badge">Starfighter Race</span>
          </div>
        </WidgetTile>
      </div>
    </OuterShell>
  );
}

// ─── NODE 6b — CREATE ────────────────────────────────────────────────────────

export function Node6b() {
  return (
    <OuterShell>
      <Header icon="⬡" tag="Day Dream · 6b" title="Create" />
      <Divider />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <WidgetTile>
          <Tag>💡 Ideas</Tag>
          <div style={{ fontSize: '12px', marginTop: '6px', lineHeight: 1.7, color: 'var(--de-text)' }}>
            Sci-Fi Trailer<br />New Podcast<br />Merch Designs
          </div>
        </WidgetTile>
        <WidgetTile>
          <Tag>✅ Tasks</Tag>
          <div style={{ fontSize: '12px', marginTop: '6px', lineHeight: 1.7, color: 'var(--de-text)' }}>
            Video Edits<br />Blog Content<br />Promo Banners
          </div>
        </WidgetTile>
        <WidgetTile>
          <Tag>📅 Calendar</Tag>
          <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--de-text)', lineHeight: 1.6 }}>
            Podcast Promo Reel<br />Social Post Draft
          </div>
        </WidgetTile>
        <WidgetTile>
          <Tag>📁 Media Vault</Tag>
          <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--de-text)', lineHeight: 1.6 }}>
            925 Camera Roll<br />265 Videos
          </div>
        </WidgetTile>
        <WidgetTile span2>
          <Tag>Projects</Tag>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
            {[
              { label: 'Planning', color: '#93c5fd', bg: 'rgba(37,99,235,0.18)', border: 'rgba(37,99,235,0.35)' },
              { label: 'In Progress', color: 'var(--de-gold)', bg: 'rgba(212,168,67,0.12)', border: 'var(--de-border-gold)' },
              { label: 'Review', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.35)' },
              { label: 'Completed', color: '#a5b4fc', bg: 'rgba(165,180,252,0.1)', border: 'rgba(165,180,252,0.25)' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: '3px 10px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: s.color,
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                }}
              >
                {s.label}
              </div>
            ))}
          </div>
        </WidgetTile>
      </div>
    </OuterShell>
  );
}
