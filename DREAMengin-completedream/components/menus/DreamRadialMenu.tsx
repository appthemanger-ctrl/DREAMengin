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

const DREAM_ITEMS: Array<{ id: string; label: string; node: Node }> = [
  { id: 'music', label: 'Music', node: '1b' },
  { id: 'lab', label: 'Lab', node: '2b' },
  { id: 'games', label: 'Games', node: '5b' },
  { id: 'code', label: 'Code', node: '3b' },
  { id: 'brand', label: 'Brand', node: '4b' },
  { id: 'create', label: 'Create', node: '6b' },
];

export default function DreamRadialMenu({ open, anchor, onClose, onSelectNode }: Props) {
  return (
    <RadialMenu
      open={open}
      anchor={anchor}
      onClose={onClose}
      items={DREAM_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        onSelect: () => onSelectNode(item.node),
      }))}
    />
  );
}
