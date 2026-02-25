'use client';

import React from 'react';

/* ── Dream goal data ── */
const DREAM_GOALS = [
  { title: 'Become an Astronaut', icon: 'rocket', badge: 1 },
  { title: 'Master Artist', icon: 'palette', badge: 2 },
  { title: 'Travel the World', icon: 'globe', badge: null },
  { title: 'Win Trophy', icon: 'trophy', badge: 3 },
  { title: 'Write a Book', icon: 'book', badge: 1 },
  { title: 'Learn an Instrument', icon: 'guitar', badge: 2 },
  { title: 'Start a Tech Business', icon: 'laptop', badge: 3 },
  { title: 'Build a Skyscraper', icon: 'building', badge: null },
  { title: 'Find True Love', icon: 'heart', badge: 2 },
  { title: 'Stay Fit & Healthy', icon: 'fitness', badge: null },
  { title: 'Create a Farm', icon: 'farm', badge: 1 },
  { title: 'Explore the Oceans', icon: 'ocean', badge: 2 },
  { title: 'Support Your Family', icon: 'family', badge: null },
];

/* Icon symbol mapping */
const ICON_MAP: Record<string, string> = {
  rocket: '\u{1F680}',
  palette: '\u{1F3A8}',
  globe: '\u{1F30D}',
  trophy: '\u{1F3C6}',
  book: '\u{1F4D6}',
  guitar: '\u{1F3B8}',
  laptop: '\u{1F4BB}',
  building: '\u{1F3D7}',
  heart: '\u{2764}',
  fitness: '\u{1F34F}',
  farm: '\u{1F3E1}',
  ocean: '\u{1F42C}',
  family: '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}',
};

function DreamCard({ title, icon, badge }: { title: string; icon: string; badge: number | null }) {
  return (
    <div className="de-widget-tile" style={{ textAlign: 'center', padding: '16px 10px', position: 'relative' }}>
      {badge !== null && (
        <span
          style={{
            position: 'absolute', top: -5, right: -5,
            background: badge === 1 ? 'var(--de-accent, #2a8ab8)' : badge === 2 ? 'var(--de-gold, #c8981a)' : '#e07040',
            color: 'white', fontSize: 10, fontWeight: 700,
            borderRadius: 100, width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {badge}
        </span>
      )}
      <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}>
        {ICON_MAP[icon] || icon}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--de-heading)', lineHeight: 1.3 }}>
        {title}
      </div>
    </div>
  );
}

function NewDreamSlot() {
  return (
    <div
      className="de-widget-tile"
      style={{
        textAlign: 'center', padding: '20px 10px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        borderStyle: 'dashed', opacity: 0.7,
      }}
    >
      <div style={{ fontSize: 28, color: 'var(--de-text-dim)', marginBottom: 6 }}>+</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)' }}>+ New Dream</div>
    </div>
  );
}

/* ── Social quick links at bottom ── */
function SocialRow() {
  const socials = [
    { platform: 'Twitter', user: 'John', time: '25m', color: '#1DA1F2' },
    { platform: 'TikTok', user: 'Emily', time: '5m', color: '#010101' },
    { platform: 'TikTok', user: 'Emily', time: '1m', color: '#ee1d52' },
    { platform: 'Twitter', user: 'Mark', time: '21m', color: '#1DA1F2' },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      {/* Platform headers */}
      <div className="flex gap-3" style={{ marginBottom: 10 }}>
        <div className="de-widget-tile" style={{ flex: 1, padding: '8px 14px', textAlign: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>Instagram</span>
        </div>
        <div className="de-widget-tile" style={{ flex: 1, padding: '8px 14px', textAlign: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--de-heading)' }}>Twitter</span>
        </div>
      </div>

      {/* Social cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {socials.map((s, i) => (
          <div key={i} className="de-widget-tile" style={{ padding: '10px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: s.color, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700,
                }}
              >
                {s.platform[0]}
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-heading)' }}>
              {s.time} {s.user}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomeFeedWidgetGrid({ onOpenDrEams }: { onOpenDrEams: () => void }) {
  return (
    <div
      data-scrollable="y"
      className="dreamnav-surface"
      style={{ overflowY: 'auto', maxHeight: '72vh', paddingRight: 4, touchAction: 'pan-y' }}
    >
      {/* Dream Library Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {DREAM_GOALS.map((goal) => (
          <DreamCard key={goal.title} {...goal} />
        ))}
        <NewDreamSlot />
        <NewDreamSlot />
        <NewDreamSlot />
      </div>

      {/* Social quick links */}
      <SocialRow />

      {/* Open Dr. Eams */}
      <button
        type="button"
        onClick={onOpenDrEams}
        style={{
          marginTop: 14,
          width: '100%',
          borderRadius: 14,
          border: '1px solid var(--de-border-gold)',
          background: 'rgba(200,152,26,0.10)',
          color: 'var(--de-gold)',
          padding: '10px 14px',
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Open Dr. Eams
      </button>
    </div>
  );
}
