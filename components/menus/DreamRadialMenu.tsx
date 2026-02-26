'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Node } from '@/lib/dreamnav/tau';
import RadialMenu from './RadialMenu';

type Props = {
  open: boolean;
  anchor: DOMRect | null;
  onClose: () => void;
  onSelectNode: (node: Node) => void;
};

const DREAM_ITEMS = [
  { id: 'music',  label: 'Music',  node: '1b' as Node, route: null },
  { id: 'lab',    label: 'Lab',    node: '2b' as Node, route: null },
  { id: 'code',   label: 'Code',   node: '3b' as Node, route: null },
  { id: 'brand',  label: 'Brand',  node: '4b' as Node, route: '/daydream/brand' },
  { id: 'games',  label: 'Games',  node: '5b' as Node, route: '/daydream/games' },
  { id: 'create', label: 'Create', node: '6b' as Node, route: null },
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
          if (item.route) {
            onClose();
            router.push(item.route);
          } else {
            onSelectNode(item.node);
          }
        },
      }))}
    />
  );
}
