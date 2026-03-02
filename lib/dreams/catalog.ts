export type Dream = {
  id: string;
  label: string;
  icon: string;
  tag: string;
  route: string;
};

export const DREAMS: Dream[] = [
  { id: 'music',         label: 'Music',          icon: '🎵', tag: 'Create',    route: '/daydream/music'  },
  { id: 'create',        label: 'Create',         icon: '⬡',  tag: 'Create',    route: '/create'          },
  { id: 'brand',         label: 'Brand',          icon: '✦',  tag: 'Create',    route: '/daydream/brand'  },
  { id: 'games',         label: 'Games',          icon: '🎮', tag: 'Play',      route: '/daydream/games'  },
  { id: 'lab',           label: 'Lab',            icon: '🔬', tag: 'Explore',   route: '/lab'             },
  { id: 'codespace',     label: 'Code',           icon: '💻', tag: 'Build',     route: '/codespace'       },
  { id: 'marketplace',   label: 'Marketplace',    icon: '🏪', tag: 'Commerce',  route: '/marketplace'     },
  { id: 'shop',          label: 'Shop',           icon: '🛍', tag: 'Commerce',  route: '/shop'            },
  { id: 'discover',      label: 'Discover',       icon: '🌌', tag: 'Explore',   route: '/discover'        },
  { id: 'daydream',      label: 'Daydream',       icon: '☁️', tag: 'Explore',   route: '/daydream'        },
  { id: 'physics-lab',   label: 'Physics',        icon: '⚛️', tag: 'Build',     route: '/physics-lab'     },
  { id: 'connectors',    label: 'Connectors',     icon: '🔗', tag: 'Settings',  route: '/connectors'      },
  { id: 'feed-settings', label: 'Feed',           icon: '📡', tag: 'Settings',  route: '/feed-settings'   },
  { id: 'settings',      label: 'Settings',       icon: '⚙️', tag: 'Settings',  route: '/settings'        },
  { id: 'profile',       label: 'Profile',        icon: '👤', tag: 'Social',    route: '/edit-profile'    },
  { id: 'messages',      label: 'Messages',       icon: '💬', tag: 'Social',    route: '/messages'        },
  { id: 'analytics',     label: 'Analytics',      icon: '📊', tag: 'Insights',  route: '/analytics'       },
  { id: 'dr-eams',       label: 'Dr. Eams',       icon: '◈',  tag: 'AI',        route: '/dr-eams'         },
  { id: 'onboarding',    label: 'Onboarding',     icon: '🚀', tag: 'Explore',   route: '/onboarding'      },
  { id: 'ads',           label: 'Ads',            icon: '📣', tag: 'Monetize',  route: '/ads'             },
  { id: 'admin',         label: 'Admin',          icon: '🛡️', tag: 'System',    route: '/admin'           },
  { id: 'anchor-demo',   label: 'Anchor',         icon: '⚓', tag: 'Demo',      route: '/anchor-demo'     },
  { id: 'policy',        label: 'Policy',         icon: '📜', tag: 'Legal',     route: '/policy'          },
  { id: 'join',          label: 'Join',           icon: '✉️', tag: 'Social',    route: '/join'            },
  { id: 'about',         label: 'About',          icon: 'ℹ️', tag: 'Info',      route: '/about'           },
  { id: 'users',         label: 'Users',          icon: '👥', tag: 'Social',    route: '/u'               },
  { id: 'dream-effects', label: 'Effects',        icon: '✨', tag: 'Create',    route: '/dream-effects'   },
  { id: 'dreamengin',    label: 'DREAMengin',     icon: '🌐', tag: 'System',    route: '/dreamengin'      },
  { id: 'music-lib',     label: 'Music Lib',      icon: '🎶', tag: 'Create',    route: '/music'           },
  { id: 'profile-view',  label: 'My Profile',     icon: '🪞', tag: 'Social',    route: '/profile'         },
  { id: 'daydream-music',label: 'DayDream Music', icon: '🎸', tag: 'Day Dream', route: '/daydream/music'  },
  { id: 'daydream-build',label: 'DayDream Build', icon: '🏗️', tag: 'Day Dream', route: '/daydream/create' },
  { id: 'daydream-brand',label: 'DayDream Brand', icon: '🎨', tag: 'Day Dream', route: '/daydream/brand'  },
  { id: 'daydream-games',label: 'DayDream Play',  icon: '🕹️', tag: 'Day Dream', route: '/daydream/games'  },
  { id: 'daydream-lab',  label: 'DayDream Lab',   icon: '🧪', tag: 'Day Dream', route: '/daydream/lab'    },
  { id: 'daydream-code', label: 'DayDream Code',  icon: '🖥️', tag: 'Day Dream', route: '/daydream/code'   },
  { id: 'dream-a',       label: 'Dream · α',      icon: '🌙', tag: 'Inner',     route: '/daydream'        },
  { id: 'dream-b',       label: 'Dream · β',      icon: '⭐', tag: 'Inner',     route: '/daydream'        },
  { id: 'dream-c',       label: 'Dream · γ',      icon: '🌠', tag: 'Inner',     route: '/daydream'        },
  { id: 'dream-d',       label: 'Dream · δ',      icon: '🌟', tag: 'Inner',     route: '/daydream'        },
  { id: 'dream-e',       label: 'Dream · ε',      icon: '💫', tag: 'Inner',     route: '/daydream'        },
  { id: 'dream-f',       label: 'Dream · ζ',      icon: '🌈', tag: 'Inner',     route: '/daydream'        },
  { id: 'dream-g',       label: 'Dream · η',      icon: '🎆', tag: 'Inner',     route: '/daydream'        },
  { id: 'dream-h',       label: 'Dream · θ',      icon: '🎇', tag: 'Inner',     route: '/daydream'        },
  { id: 'dream-i',       label: 'Dream · ι',      icon: '🔮', tag: 'Inner',     route: '/daydream'        },
  { id: 'dream-j',       label: 'Dream · κ',      icon: '🌊', tag: 'Inner',     route: '/daydream'        },
  { id: 'dream-k',       label: 'Dream · λ',      icon: '🏔️', tag: 'Inner',     route: '/daydream'        },
  { id: 'dream-l',       label: 'Dream · μ',      icon: '🌺', tag: 'Inner',     route: '/daydream'        },
];

export const DREAMS_BY_ID: Record<string, Dream> = Object.fromEntries(DREAMS.map((d) => [d.id, d]));
