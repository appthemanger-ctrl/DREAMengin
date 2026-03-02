'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Dream = {
  id: string;
  label: string;
  icon: string;
  tag: string;
  route: string;
};

const DREAMS: Dream[] = [
  { id: 'music',          label: 'Music',         icon: '🎵', tag: 'Create',      route: '/daydream/music'    },
  { id: 'create',         label: 'Create',        icon: '⬡',  tag: 'Create',      route: '/create'            },
  { id: 'brand',          label: 'Brand',         icon: '✦',  tag: 'Create',      route: '/daydream/brand'    },
  { id: 'games',          label: 'Games',         icon: '🎮', tag: 'Play',        route: '/daydream/games'    },
  { id: 'lab',            label: 'Lab',           icon: '🔬', tag: 'Explore',     route: '/lab'               },
  { id: 'codespace',      label: 'Code',          icon: '💻', tag: 'Build',       route: '/codespace'         },
  { id: 'marketplace',    label: 'Marketplace',   icon: '🏪', tag: 'Commerce',    route: '/marketplace'       },
  { id: 'shop',           label: 'Shop',          icon: '🛍', tag: 'Commerce',    route: '/shop'              },
  { id: 'discover',       label: 'Discover',      icon: '🌌', tag: 'Explore',     route: '/discover'          },
  { id: 'daydream',       label: 'Daydream',      icon: '☁️', tag: 'Explore',     route: '/daydream'          },
  { id: 'physics-lab',    label: 'Physics',       icon: '⚛️', tag: 'Build',       route: '/physics-lab'       },
  { id: 'connectors',     label: 'Connectors',    icon: '🔗', tag: 'Settings',    route: '/connectors'        },
  { id: 'feed-settings',  label: 'Feed',          icon: '📡', tag: 'Settings',    route: '/feed-settings'     },
  { id: 'settings',       label: 'Settings',      icon: '⚙️', tag: 'Settings',    route: '/settings'          },
  { id: 'profile',        label: 'Profile',       icon: '👤', tag: 'Social',      route: '/edit-profile'      },
  { id: 'messages',       label: 'Messages',      icon: '💬', tag: 'Social',      route: '/messages'          },
  { id: 'analytics',      label: 'Analytics',     icon: '📊', tag: 'Insights',    route: '/analytics'         },
  { id: 'dr-eams',        label: 'Dr. Eams',      icon: '◈',  tag: 'AI',          route: '/dr-eams'           },
  { id: 'onboarding',     label: 'Onboarding',    icon: '🚀', tag: 'Explore',     route: '/onboarding'        },
  { id: 'ads',            label: 'Ads',           icon: '📣', tag: 'Monetize',    route: '/ads'               },
  { id: 'admin',          label: 'Admin',         icon: '🛡️', tag: 'System',      route: '/admin'             },
  { id: 'anchor-demo',    label: 'Anchor',        icon: '⚓', tag: 'Demo',        route: '/anchor-demo'       },
  { id: 'policy',         label: 'Policy',        icon: '📜', tag: 'Legal',       route: '/policy'            },
  { id: 'join',           label: 'Join',          icon: '✉️', tag: 'Social',      route: '/join'              },
  { id: 'about',          label: 'About',         icon: 'ℹ️', tag: 'Info',        route: '/about'             },
  { id: 'users',          label: 'Users',         icon: '👥', tag: 'Social',      route: '/u'                 },
  { id: 'dream-effects',  label: 'Effects',       icon: '✨', tag: 'Create',      route: '/dream-effects'     },
  { id: 'dreamengin',     label: 'DREAMengin',    icon: '🌐', tag: 'System',      route: '/dreamengin'        },
  { id: 'music-lib',      label: 'Music Lib',     icon: '🎶', tag: 'Create',      route: '/music'             },
  { id: 'profile-view',   label: 'My Profile',    icon: '🪞', tag: 'Social',      route: '/profile'           },
  { id: 'analytics-2',    label: 'Insights',      icon: '📈', tag: 'Insights',    route: '/analytics'         },
  { id: 'daydream-music', label: 'DayDream Music',icon: '🎸', tag: 'Day Dream',   route: '/daydream/music'    },
  { id: 'daydream-create',label: 'DayDream Build',icon: '🏗️', tag: 'Day Dream',   route: '/daydream/create'   },
  { id: 'daydream-brand', label: 'DayDream Brand',icon: '🎨', tag: 'Day Dream',   route: '/daydream/brand'    },
  { id: 'daydream-games', label: 'DayDream Play', icon: '🕹️', tag: 'Day Dream',   route: '/daydream/games'    },
  { id: 'daydream-lab',   label: 'DayDream Lab',  icon: '🧪', tag: 'Day Dream',   route: '/daydream/lab'      },
  { id: 'daydream-code',  label: 'DayDream Code', icon: '🖥️', tag: 'Day Dream',   route: '/daydream/code'     },
  { id: 'inner-1',        label: 'Dream · α',     icon: '🌙', tag: 'Inner',       route: '/daydream'          },
  { id: 'inner-2',        label: 'Dream · β',     icon: '⭐', tag: 'Inner',       route: '/daydream'          },
  { id: 'inner-3',        label: 'Dream · γ',     icon: '🌠', tag: 'Inner',       route: '/daydream'          },
  { id: 'inner-4',        label: 'Dream · δ',     icon: '🌟', tag: 'Inner',       route: '/daydream'          },
  { id: 'inner-5',        label: 'Dream · ε',     icon: '💫', tag: 'Inner',       route: '/daydream'          },
  { id: 'inner-6',        label: 'Dream · ζ',     icon: '🌈', tag: 'Inner',       route: '/daydream'          },
  { id: 'inner-7',        label: 'Dream · η',     icon: '🎆', tag: 'Inner',       route: '/daydream'          },
  { id: 'inner-8',        label: 'Dream · θ',     icon: '🎇', tag: 'Inner',       route: '/daydream'          },
  { id: 'inner-9',        label: 'Dream · ι',     icon: '🔮', tag: 'Inner',       route: '/daydream'          },
  { id: 'inner-10',       label: 'Dream · κ',     icon: '🌊', tag: 'Inner',       route: '/daydream'          },
  { id: 'inner-11',       label: 'Dream · λ',     icon: '🏔️', tag: 'Inner',       route: '/daydream'          },
  { id: 'inner-12',       label: 'Dream · μ',     icon: '🌺', tag: 'Inner',       route: '/daydream'          },
];

const STORAGE_KEY = 'dreamengin:dreams:favorites';

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function saveFavorites(favs: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs])); } catch { /* noop */ }
}

export default function DreamsGrid() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filterFavs, setFilterFavs] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setFavorites(loadFavorites());
    setMounted(true);
  }, []);

  const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveFavorites(next);
      return next;
    });
  }, []);

  const displayed = filterFavs ? DREAMS.filter((d) => favorites.has(d.id)) : DREAMS;

  return (
    <section style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--de-gold, #d4a843)' }}>
            Dreams
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading, #f0f4ff)', marginLeft: 8 }}>
            All {DREAMS.length} Dreams
          </span>
        </div>
        {mounted && (
          <button
            type="button"
            onClick={() => setFilterFavs((v) => !v)}
            style={{
              background: filterFavs ? 'rgba(212,168,67,0.2)' : 'rgba(160,185,255,0.08)',
              border: filterFavs ? '1px solid rgba(212,168,67,0.5)' : '1px solid rgba(100,150,255,0.15)',
              borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
              color: filterFavs ? 'var(--de-gold, #d4a843)' : 'rgba(160,185,255,0.6)',
            }}
          >
            ★ Favorites {favorites.size > 0 ? `(${favorites.size})` : ''}
          </button>
        )}
      </div>

      {/* Grid */}
      {displayed.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(160,185,255,0.4)', fontSize: 13 }}>
          No favorites yet — tap ★ on any dream to save it
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
          gap: 8,
        }}>
          {displayed.map((dream) => {
            const isFav = mounted && favorites.has(dream.id);
            return (
              <div
                key={dream.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(dream.route)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(dream.route); }}
                style={{
                  position: 'relative',
                  background: 'rgba(5,15,45,0.7)',
                  border: isFav
                    ? '1px solid rgba(212,168,67,0.45)'
                    : '1px solid rgba(100,150,255,0.1)',
                  borderRadius: 14, padding: '12px 6px 10px',
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'border-color 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(100,150,255,0.1)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(5,15,45,0.7)'; }}
              >
                {/* Favorite star */}
                {mounted && (
                  <button
                    type="button"
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    onClick={(e) => toggleFavorite(dream.id, e)}
                    style={{
                      position: 'absolute', top: 5, right: 5,
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 10, lineHeight: 1, padding: 2,
                      color: isFav ? 'var(--de-gold, #d4a843)' : 'rgba(160,185,255,0.25)',
                    }}
                  >
                    ★
                  </button>
                )}
                <div style={{ fontSize: 22, marginBottom: 5 }}>{dream.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading, #f0f4ff)', lineHeight: 1.2, marginBottom: 3 }}>
                  {dream.label}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(160,185,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {dream.tag}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
