'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const ALL_DREAMS: Array<{ id: string; label: string; icon: string; tag: string; route: string }> = [
  { id: '1b', label: 'Music',     icon: '🎵', tag: 'Day Dream · Music',     route: '/daydream/music'   },
  { id: '2b', label: 'Lab',       icon: '🔬', tag: 'Day Dream · Lab',       route: '/lab'              },
  { id: '3b', label: 'Code',      icon: '💻', tag: 'Day Dream · Code',      route: '/codespace'        },
  { id: '4b', label: 'Brand',     icon: '✦',  tag: 'Day Dream · Brand',     route: '/daydream/brand'   },
  { id: '5b', label: 'Games',     icon: '🎮', tag: 'Day Dream · Games',     route: '/daydream/games'   },
  { id: '6b', label: 'Create',    icon: '⬡',  tag: 'Day Dream · Create',    route: '/create'           },
  { id: '1',  label: 'Explore',   icon: '🌌', tag: 'Discover',              route: '/discover'         },
  { id: '2',  label: 'Analytics', icon: '📊', tag: 'Analytics',             route: '/analytics'        },
  { id: '3',  label: 'Studio',    icon: '🎵', tag: 'Music',                 route: '/music'            },
  { id: '4',  label: 'Editor',    icon: '💻', tag: 'Profile',               route: '/edit-profile'     },
  { id: '5',  label: 'Shop',      icon: '🛍', tag: 'Shop',          route: '/shop'             },
  { id: '6',  label: 'Market',    icon: '✦',  tag: 'Marketplace',   route: '/marketplace'      },
];

export default function ViewAllDreamsOverlay({
  onClose,
  onReturnHome,
}: {
  onClose: () => void;
  onReturnHome: () => void;
}) {
  const router = useRouter();

  const goTo = (route: string) => {
    onClose();
    router.push(route);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 65,
        background: 'rgba(2,8,24,0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(92vw, 520px)',
          background: 'rgba(5,15,45,0.95)',
          border: '1px solid rgba(212,168,67,0.25)',
          borderRadius: 28, padding: 24, margin: '20px 0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="de-tag" style={{ marginBottom: 2 }}>Dream Library</div>
            <div style={{ fontWeight: 700, fontSize: 22, color: '#f0f4ff' }}>All Dreams</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 12,
              border: '1px solid rgba(100,150,255,0.15)',
              background: 'rgba(160,185,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(160,185,255,0.5)', fontSize: 14,
            }}
          >✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {ALL_DREAMS.map(({ id, label, icon, tag, route }) => (
            <button
              key={id}
              type="button"
              onClick={() => goTo(route)}
              className="de-tile"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', padding: '14px 8px', border: 'none', cursor: 'pointer',
                color: 'inherit', background: 'rgba(160,185,255,0.06)',
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff' }}>{label}</div>
              <div className="de-tag" style={{ marginTop: 3 }}>{tag}</div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onReturnHome}
          style={{
            marginTop: 16, width: '100%', padding: '12px 24px',
            background: 'rgba(26,78,216,0.25)', border: '1px solid rgba(37,99,235,0.35)',
            borderRadius: 14, color: '#93c5fd', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ◉ Return Home
        </button>
      </div>
    </div>
  );
}
