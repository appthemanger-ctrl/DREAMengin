'use client';

import React from 'react';
import Link from 'next/link';

// ---- Shared Primitives ----

function Tag({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="de-tag" style={{ color: 'var(--de-text-dim)', ...style }}>{children}</div>;
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
    <div className="de-widget-tile" style={{ gridColumn: span2 ? 'span 2' : undefined, ...style }}>
      {children}
    </div>
  );
}

function OuterShell({ children }: { children: React.ReactNode }) {
  return <div className="de-outer-shell">{children}</div>;
}

function Header({ tag, title }: { tag: string; title: string }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <Tag>{tag}</Tag>
      <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: 'var(--de-heading)' }}>{title}</div>
    </div>
  );
}

function NodeFooter() {
  return (
    <div className="flex justify-center" style={{ padding: '16px 0 4px' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/dreamengin-logo.jpg"
        alt="DREAMengin"
        width={40}
        height={40}
        style={{ borderRadius: '50%', objectFit: 'cover' }}
      />
    </div>
  );
}

// ---- NODE 1b -- MUSIC RELEASES ----

export function Node1b() {
  return (
    <OuterShell>
      <Header tag="Day Dream - 1b" title="Releases" />
      <Divider />

      {/* Featured release */}
      <div className="de-widget-tile" style={{ padding: 16, marginBottom: 14 }}>
        <div className="flex justify-between items-start" style={{ marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--de-heading)' }}>Dream Aria</div>
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>Album - 14 Tracks</div>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: 6, fontSize: 10, fontWeight: 700,
            background: '#34d399', color: 'white',
          }}>
            PUBLISHED
          </span>
        </div>
        {/* Mini chart */}
        <svg viewBox="0 0 200 40" style={{ width: '100%', height: 40, marginBottom: 10 }}>
          <polyline
            points="0,30 25,25 50,28 75,18 100,22 125,12 150,16 175,10 200,14"
            fill="none" stroke="var(--de-accent)" strokeWidth="2" strokeLinecap="round"
          />
        </svg>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
          {[
            { label: 'Streams', value: '174,052' },
            { label: 'Total Revenue', value: '$2,762.43' },
            { label: 'Growth', value: '+23.8%', color: '#34d399' },
            { label: 'Followers', value: '12,452' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.color || 'var(--de-heading)' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'var(--de-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Releases list */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 10 }}>Releases</div>
      {[
        { name: 'Atmospheric Chill', type: 'Single 39 month', streams: '94,401', rev: '$1,7306', followers: '8,702' },
        { name: 'Galactic Dreams', type: 'Album 3 months', streams: '2445,518', rev: '$4,123.95', followers: '19,123' },
        { name: 'Starlight', type: 'EP 3nd month', streams: '59,401', rev: '$672.78', followers: '3,075' },
      ].map((r) => (
        <div key={r.name} className="de-widget-tile" style={{ padding: 14, marginBottom: 8 }}>
          <div className="flex gap-3 items-center">
            <div style={{
              width: 48, height: 48, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--de-accent), var(--de-gold))',
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: 'white', fontWeight: 700,
            }}>
              {r.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)' }}>{r.name}</div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{r.type}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 10, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Streams</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{r.streams}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Revenue</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-gold)' }}>{r.rev}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Followers</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-accent)' }}>{r.followers}</div>
            </div>
          </div>
        </div>
      ))}

      <NodeFooter />
    </OuterShell>
  );
}

// ---- NODE 2b -- LAB ----

export function Node2b() {
  return (
    <OuterShell>
      <Header tag="Day Dream - 2b" title="Lab" />
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', marginTop: '8px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--de-gold)' }}>9.6%</div>
              <Tag>Protein Syn.</Tag>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--de-accent)' }}>75%</div>
              <Tag>Fluid Analysis</Tag>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#34d399' }}>4%</div>
              <Tag>DNA Amp.</Tag>
            </div>
          </div>
        </WidgetTile>
      </div>
      <NodeFooter />
    </OuterShell>
  );
}

// ---- NODE 3b -- CODE DAYDREAM ----

const NODE3B_DEFAULT_HTML = `<!DOCTYPE html><html><head><style>body{margin:0;background:linear-gradient(135deg,#1a1a3e,#0d0d2b);color:#e0e0f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px}.dot{width:12px;height:12px;border-radius:50%;background:#6366f1;animation:pulse 1.5s infinite}.dot:nth-child(2){animation-delay:.3s;background:#8b5cf6}.dot:nth-child(3){animation-delay:.6s;background:#a78bfa}@keyframes pulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.4);opacity:1}}</style></head><body><div class=dot></div><div class=dot></div><div class=dot></div><p style="font-size:13px;opacity:.6">DREAMengin CodeSpace</p></body></html>`;

export function Node3b() {
  return (
    <OuterShell>
      <Header tag="Day Dream · Code" title="Code Lab" />
      <Divider />

      {/* Live render preview */}
      <div style={{ height: 120, overflow: 'hidden', borderRadius: 12, border: '1px solid var(--de-border)', marginBottom: 12 }}>
        <iframe
          srcDoc={NODE3B_DEFAULT_HTML}
          width="100%"
          height="100%"
          style={{ border: 'none', display: 'block' }}
          sandbox="allow-scripts"
          title="CodeSpace Preview"
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <Link href="/lab" className="de-btn de-btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
          🔬 Open Lab
        </Link>
        <Link href="/lab/new" className="de-btn de-btn-gold" style={{ textAlign: 'center', textDecoration: 'none' }}>
          ✦ New Project
        </Link>
        <Link href="/lab/demo-1/codespace" className="de-btn de-btn-ghost" style={{ textAlign: 'center', textDecoration: 'none' }}>
          💻 CodeSpace Demo
        </Link>
      </div>

      {/* Code snippet */}
      <div style={{
        background: 'rgba(15,20,40,0.92)',
        border: '1px solid var(--de-border)',
        borderRadius: 12,
        padding: 12,
        color: '#7dd3fc',
        fontSize: 12,
        fontFamily: 'monospace',
        marginBottom: 12,
        whiteSpace: 'pre',
      }}>
        {`const dream = () => {\n  return <Surface node={node} />;\n};`}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <WidgetTile style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-gold)' }}>189 commits</div>
        </WidgetTile>
        <WidgetTile style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>{'All tests ✓'}</div>
        </WidgetTile>
        <WidgetTile style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-accent)' }}>58 FPS</div>
        </WidgetTile>
      </div>

      <NodeFooter />
    </OuterShell>
  );
}

// ---- NODE 4b -- BRAND ----

export function Node4b() {
  return (
    <OuterShell>
      <Header tag="Day Dream - 4b" title="Brand" />
      <Divider />

      {/* Profile card */}
      <div className="de-widget-tile" style={{ padding: 16, marginBottom: 14 }}>
        <div className="flex gap-3 items-center">
          <div style={{
            width: 64, height: 64, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--de-accent), var(--de-gold))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: 'white', fontWeight: 700, flexShrink: 0,
          }}>
            DV
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--de-heading)' }}>DreamVerse</div>
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>@DreamVerseHQ</div>
            <div style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>1,284 Followers</div>
          </div>
        </div>
        <button type="button" style={{
          marginTop: 10, padding: '8px 20px', borderRadius: 10,
          background: 'var(--de-mist)', border: '1px solid var(--de-border)',
          color: 'var(--de-heading)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          Edit Profile
        </button>
      </div>

      {/* Social Scheduler */}
      <div className="de-widget-tile" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 8 }}>Social Scheduler</div>
        <div className="flex gap-2">
          {['Instagram', 'Masens', 'Cooro'].map((p) => (
            <span key={p} style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: 'var(--de-mist)', border: '1px solid var(--de-border)', color: 'var(--de-text)',
            }}>{p}</span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--de-accent)', marginTop: 8 }}>Promo Banners + 24 &gt;</div>
      </div>

      {/* Projects */}
      <div className="de-widget-tile" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 10 }}>Projects</div>
        <div className="flex gap-2 flex-wrap" style={{ marginBottom: 10 }}>
          {['Planning', 'In Progress', 'Review', 'Completed'].map((tab) => (
            <span key={tab} style={{
              padding: '4px 12px', borderRadius: 8, fontSize: 10, fontWeight: 600,
              background: tab === 'In Progress' ? 'rgba(200,152,26,0.12)' : 'var(--de-mist)',
              border: `1px solid ${tab === 'In Progress' ? 'var(--de-border-gold)' : 'var(--de-border)'}`,
              color: tab === 'In Progress' ? 'var(--de-gold)' : 'var(--de-text-dim)',
            }}>{tab}</span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {[
            { name: 'Trailer Storyboards', status: 'Apr 38' },
            { name: 'Scalar Squadrons', status: 'Apr 25' },
            { name: 'In Progress', status: '' },
            { name: 'Thumbnail Concepts', status: 'Booss' },
            { name: 'Blog Article New', status: 'Apr 25' },
            { name: 'Blog Artique', status: 'Poocrass' },
          ].map((p) => (
            <div key={p.name} style={{
              padding: '8px 6px', borderRadius: 8,
              background: 'var(--de-mist)', border: '1px solid var(--de-border)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-heading)', lineHeight: 1.3 }}>{p.name}</div>
              {p.status && <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2 }}>{p.status}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Media Library */}
      <div className="de-widget-tile" style={{ padding: 14 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)' }}>Media Library</div>
          <div className="flex gap-2">
            {['Schedule', 'Requests', 'QUICK', 'TOOLS'].map((t) => (
              <span key={t} style={{ fontSize: 10, color: 'var(--de-text-dim)', fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              height: 40, borderRadius: 8,
              background: `linear-gradient(135deg, ${i % 2 === 0 ? 'var(--de-accent)' : 'var(--de-gold)'}, var(--de-mist))`,
              opacity: 0.3,
            }} />
          ))}
        </div>
      </div>

      <NodeFooter />
    </OuterShell>
  );
}

// ---- NODE 5b -- GAMES ----

export function Node5b() {
  return (
    <OuterShell>
      <Header tag="Day Dream - 5b" title="Games" />
      <Divider />

      {/* Friends & Discover header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="de-widget-tile" style={{ padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 6 }}>Friends</div>
          <div style={{ fontSize: 12, color: 'var(--de-text)' }}>Friends Online 8</div>
        </div>
        <div className="de-widget-tile" style={{ padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 6 }}>Discover</div>
          <div style={{ fontSize: 12, color: 'var(--de-text)' }}>Gran storm...</div>
        </div>
      </div>

      {/* Trending & Achievements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="de-widget-tile" style={{ padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 6 }}>Trending Now</div>
          <div style={{ fontSize: 12, color: 'var(--de-text)' }}>Dream Valley, RPG</div>
        </div>
        <div className="de-widget-tile" style={{ padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 6 }}>Achievements</div>
          <div style={{ fontSize: 12, color: 'var(--de-gold)' }}>Night Drive</div>
        </div>
      </div>

      {/* My Library */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 8 }}>
        My Library
        <span style={{ float: 'right', fontSize: 12, color: 'var(--de-text-dim)', fontWeight: 400, cursor: 'pointer' }}>Search</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { name: 'COSMIC ADVENTURE', color: 'var(--de-accent)' },
          { name: 'DESTINY ADMIRAL', color: 'var(--de-gold)' },
          { name: 'DREAM VALLEY', color: '#34d399' },
          { name: 'APEX LEGENDS', color: '#e07040' },
        ].map((game) => (
          <div key={game.name} className="de-widget-tile" style={{ padding: 14 }}>
            <div style={{
              height: 48, borderRadius: 10, marginBottom: 8,
              background: `linear-gradient(135deg, ${game.color}, var(--de-mist))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'white', letterSpacing: '0.08em' }}>
                {game.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Available Now */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 8 }}>
        Available Now
        <span style={{ float: 'right', fontSize: 11, color: 'var(--de-text-dim)' }}>5 more &gt;</span>
      </div>
      <div className="flex gap-2" style={{ marginBottom: 14, overflowX: 'auto' }}>
        {['Starfighter', 'Nebula Drift', 'SCI-FI SIMULATOR'].map((g) => (
          <div key={g} className="de-widget-tile" style={{ minWidth: 100, padding: '10px 12px', flexShrink: 0 }}>
            <div style={{ height: 40, borderRadius: 8, background: 'var(--de-mist)', marginBottom: 6 }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-heading)' }}>{g}</div>
          </div>
        ))}
      </div>

      {/* Bottom tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: 'Store', sub: 'Trense Doats' },
          { label: 'Downloads', sub: 'Downloads & Items' },
          { label: 'News', sub: 'Game Updates' },
        ].map((tab) => (
          <div key={tab.label} className="de-widget-tile" style={{ textAlign: 'center', padding: '10px 8px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>{tab.label}</div>
            <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginTop: 2 }}>{tab.sub}</div>
          </div>
        ))}
      </div>

      <NodeFooter />
    </OuterShell>
  );
}

// ---- NODE 6b -- CREATE / MEDIA VAULT ----

export function Node6b() {
  return (
    <OuterShell>
      <Header tag="Day Dream - 6b" title="Create" />
      <Divider />

      {/* Ideas & Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 12 }}>
        <WidgetTile>
          <Tag>Ideas</Tag>
          <div style={{ fontSize: '12px', marginTop: '6px', lineHeight: 1.7, color: 'var(--de-text)' }}>
            Sci-Fi Game Trailer<br />New Podcast<br />Merch Designs
          </div>
          <div style={{ fontSize: 11, color: 'var(--de-accent)', marginTop: 6 }}>+ More &gt;</div>
        </WidgetTile>
        <WidgetTile>
          <Tag>Tasks</Tag>
          <div style={{ fontSize: '12px', marginTop: '6px', lineHeight: 1.7, color: 'var(--de-text)' }}>
            Video Edits<br />Blog Content<br />Promo Banners
          </div>
          <div style={{ fontSize: 11, color: 'var(--de-accent)', marginTop: 6 }}>+ More &gt;</div>
        </WidgetTile>
      </div>

      {/* Tasks & Calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 12 }}>
        <WidgetTile>
          <Tag>Tasks</Tag>
          <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--de-text)', lineHeight: 1.6 }}>
            {'< Video Edits > Blog Content'}<br />{'< Promo Banners'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--de-accent)', marginTop: 6 }}>+ More &gt;</div>
        </WidgetTile>
        <WidgetTile>
          <Tag>Calendar</Tag>
          <div className="flex gap-1 flex-wrap" style={{ marginTop: 6 }}>
            {['Thursday', 'Part', 'Vast', 'Sant', 'Nt'].map((d) => (
              <span key={d} style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, background: 'var(--de-mist)', color: 'var(--de-text-dim)' }}>{d}</span>
            ))}
          </div>
          <div className="flex gap-1" style={{ marginTop: 4 }}>
            {[25, 385, 25, 25, 27].map((n, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-heading)', width: 24, textAlign: 'center' }}>{n}</span>
            ))}
          </div>
        </WidgetTile>
      </div>

      {/* Projects */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', textAlign: 'center', marginBottom: 10 }}>
        Projects
      </div>
      <div className="flex gap-2 flex-wrap" style={{ marginBottom: 10, justifyContent: 'center' }}>
        {['Planning', 'In Progress', 'Review', 'Completed'].map((tab) => (
          <span key={tab} style={{
            padding: '4px 12px', borderRadius: 8, fontSize: 10, fontWeight: 600,
            background: tab === 'In Progress' ? 'rgba(200,152,26,0.12)' : 'var(--de-mist)',
            border: `1px solid ${tab === 'In Progress' ? 'var(--de-border-gold)' : 'var(--de-border)'}`,
            color: tab === 'In Progress' ? 'var(--de-gold)' : 'var(--de-text-dim)',
          }}>{tab}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
        {[
          'Trailer Storyboards',
          'Thumbnail Concepts',
          'Q&A Highlights',
          'Conference Prep',
          'Blog Article: NewVolt',
          'Podcast Promo Reel',
        ].map((p) => (
          <div key={p} style={{
            padding: '8px 6px', borderRadius: 8,
            background: 'var(--de-mist)', border: '1px solid var(--de-border)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-heading)', lineHeight: 1.3 }}>{p}</div>
          </div>
        ))}
      </div>

      {/* Media Library */}
      <div className="de-widget-tile" style={{ padding: 14 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)' }}>Media Library</div>
          <div className="flex gap-2">
            {['Camera Roll', 'Videos', 'Music', 'Upload'].map((t) => (
              <span key={t} style={{ fontSize: 10, color: 'var(--de-text-dim)', fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{
              height: 36, borderRadius: 6,
              background: `linear-gradient(135deg, ${i % 3 === 0 ? 'var(--de-accent)' : i % 3 === 1 ? 'var(--de-gold)' : '#34d399'}, var(--de-mist))`,
              opacity: 0.3,
            }} />
          ))}
        </div>
        <div style={{ textAlign: 'right', marginTop: 8, fontSize: 11, color: 'var(--de-accent)' }}>+ Move</div>
      </div>

      <NodeFooter />
    </OuterShell>
  );
}
