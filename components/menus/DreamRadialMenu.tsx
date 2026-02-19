'use client';

import React from 'react';
import type { Node } from '@/lib/dreamnav/tau';
import RadialMenu from './RadialMenu';

type Props = {
  open: boolean;
  anchor: DOMRect | null;
  onClose: () => void;
  onSelectNode: (node: Node) => void;
};

const DREAM_ITEMS = [
  { id: 'music',  label: 'Music',  node: '1b' as Node },
  { id: 'lab',    label: 'Lab',    node: '2b' as Node },
  { id: 'code',   label: 'Code',   node: '3b' as Node },
  { id: 'brand',  label: 'Brand',  node: '4b' as Node },
  { id: 'games',  label: 'Games',  node: '5b' as Node },
  { id: 'create', label: 'Create', node: '6b' as Node },
];

export default function DreamRadialMenu({ open, anchor, onClose, onSelectNode }: Props) {
  return (
    <RadialMenu
      open={open}
      anchor={anchor}
      onClose={onClose}
      variant="blue"
      items={DREAM_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        onSelect: () => onSelectNode(item.node),
      }))}
    />
  );
}
