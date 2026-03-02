'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import FanMenu from './FanMenu';
import type { MenuItem } from './MenuPanel';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectNode?: (node: string) => void;
  anchorX: number;
  anchorY: number;
  side?: 'left' | 'right';
};

// Six fixed Daydream apps + Marketplace + Shop (req 32)
const DREAM_ITEMS = [
  { id: 'music',       label: 'Music',       icon: '🎵', route: '/daydream/music'       },
  { id: 'create',      label: 'Create',      icon: '⬡',  route: '/daydream/create'      },
  { id: 'brand',       label: 'Brand',       icon: '✦',  route: '/daydream/brand'       },
  { id: 'games',       label: 'Games',       icon: '🎮', route: '/daydream/games'       },
  { id: 'lab',         label: 'Lab',         icon: '🔬', route: '/daydream/lab'         },
  { id: 'code',        label: 'Code',        icon: '💻', route: '/daydream/code'        },
  { id: 'marketplace', label: 'Marketplace', icon: '🏪', route: '/marketplace'          },
  { id: 'shop',        label: 'Shop',        icon: '🛍', route: '/shop'                 },
];

export default function DreamRadialMenu({ open, onClose, onSelectNode, anchorX, anchorY, side }: Props) {
  const router = useRouter();

  const items: MenuItem[] = DREAM_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    onSelect: () => {
      onClose();
      if (onSelectNode) onSelectNode(item.id);
      router.push(item.route);
    },
  }));

  return (
    <FanMenu
      open={open}
      items={items}
      anchorX={anchorX}
      anchorY={anchorY}
      accent="blue"
      side={side}
      onClose={onClose}
    />
  );
}
