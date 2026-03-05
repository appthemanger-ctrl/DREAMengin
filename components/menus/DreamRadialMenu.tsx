'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MenuPanel, { type MenuItem } from './MenuPanel';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectNode?: (node: string) => void;
  side?: 'left' | 'right' | 'center';
};

// Six fixed Daydream apps + Marketplace + Shop (SPEC §4)
const DREAM_ITEMS = [
  { id: 'music',       label: 'Music Studio',  icon: '🎵', description: 'Label, releases, recorder, playlist', route: '/daydream/music'       },
  { id: 'media-vault', label: 'Media Vault',   icon: '🎞', description: 'Private media library',              route: '/daydream/media-vault'  },
  { id: 'create',      label: 'Create',        icon: '⬡',  description: 'Ideas, tasks, calendar, projects',   route: '/daydream/create'       },
  { id: 'brand',       label: 'Brand',         icon: '✦',  description: 'Profile, social, promotions',         route: '/daydream/brand'        },
  { id: 'analytics',   label: 'Analytics',     icon: '📊', description: 'Traffic, revenue, growth',            route: '/daydream/analytics'    },
  { id: 'games',       label: 'Games',         icon: '🎮', description: 'Game library, leaderboard',           route: '/daydream/games'        },
  { id: 'play',        label: 'Play',          icon: '▶',  description: 'Music + video player, queue',         route: '/daydream/play'         },
  { id: 'marketplace', label: 'Marketplace',   icon: '🏪', description: 'Browse and discover',                 route: '/marketplace'           },
  { id: 'shop',        label: 'Shop',          icon: '🛍', description: 'Your storefront',                     route: '/shop'                  },
];

export default function DreamRadialMenu({ open, onClose, onSelectNode, side }: Props) {
  const router = useRouter();

  const items: MenuItem[] = DREAM_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    description: item.description,
    onSelect: () => {
      onClose();
      if (onSelectNode) onSelectNode(item.id);
      router.push(item.route);
    },
  }));

  return (
    <MenuPanel
      open={open}
      title="Daydreams"
      accent="blue"
      items={items}
      onClose={onClose}
      side={side}
    />
  );
}
