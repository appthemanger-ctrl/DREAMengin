'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DreamConstellationMap from '@/components/daydream/DreamConstellationMap';

export default function ConstellationClient() {
  return (
    <div
      style={{
        position:   'fixed',
        inset:       0,
        background: 'linear-gradient(155deg, #020818 0%, #060e24 50%, #030a1a 100%)',
        display:    'flex',
        flexDirection: 'column',
        overflow:   'hidden',
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          position:       'relative',
          zIndex:          20,
          display:         'flex',
          alignItems:      'center',
          gap:             12,
          padding:         '16px 20px',
          borderBottom:    '1px solid rgba(255,255,255,0.06)',
          background:      'rgba(2,8,24,0.70)',
          backdropFilter:  'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          flexShrink:      0,
        }}
      >
        <Link
          href="/homedream"
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:              6,
            color:           'rgba(160,195,240,0.70)',
            textDecoration:  'none',
            fontSize:        13,
            fontWeight:      600,
            padding:         '6px 12px',
            borderRadius:    20,
            background:      'rgba(255,255,255,0.05)',
            border:          '1px solid rgba(255,255,255,0.08)',
            transition:      'background 0.18s',
          }}
        >
          <ArrowLeft size={14} />
          Home
        </Link>

        <div style={{ flex: 1 }} />

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize:      17,
              fontWeight:    800,
              letterSpacing: '-0.02em',
              background:    'linear-gradient(135deg, #e8d090 0%, #c8981a 50%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ✦ Dream Constellation
          </div>
          <div
            style={{
              fontSize:      10,
              color:         'rgba(140,170,220,0.45)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight:    600,
              marginTop:      2,
            }}
          >
            click a node to enter that Daydream
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Hint badge */}
        <div
          style={{
            fontSize:      10,
            color:         'rgba(200,152,26,0.65)',
            letterSpacing: '0.10em',
            fontWeight:    700,
            padding:       '5px 10px',
            borderRadius:   20,
            background:    'rgba(200,152,26,0.08)',
            border:        '1px solid rgba(200,152,26,0.20)',
            whiteSpace:    'nowrap',
          }}
        >
          7 surfaces · hover to explore
        </div>
      </div>

      {/* ── Canvas fills remaining space ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <DreamConstellationMap />
      </div>
    </div>
  );
}
