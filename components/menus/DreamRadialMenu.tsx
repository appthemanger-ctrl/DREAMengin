'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import RadialMenu from './RadialMenu';

type Props = {
  open: boolean;
  anchor: DOMRect | null;
  onClose: () => void;
  onSelectNode?: (node: string) => void;
};

const DREAM_ITEMS = [
  { id: 'music',       label: 'Music',     route: '/daydream/music'       },
  { id: 'media-vault', label: 'Media',     route: '/daydream/media-vault' },
  { id: 'create',      label: 'Create',    route: '/daydream/create'      },
  { id: 'brand',       label: 'Brand',     route: '/daydream/brand'       },
  { id: 'analytics',   label: 'Analytics', route: '/daydream/analytics'   },
  { id: 'games',       label: 'Games',     route: '/daydream/games'       },
  { id: 'play',        label: 'Play',      route: '/daydream/play'        },
  { id: 'marketplace', label: 'Shop',      route: '/marketplace'          },
];

export default function DreamRadialMenu({ open, anchor, onClose, onSelectNode }: Props) {
  const router = useRouter();

  return (
    <RadialMenu
      open={open}
      anchor={anchor}
      onClose={onClose}
      variant="blue"
      items={DREAM_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        onSelect: () => {
          onClose();
          router.push(item.route);
        },
      }))}
    />
  );
}
