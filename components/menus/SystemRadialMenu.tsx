'use client';

import React from 'react';
import FanMenu from './FanMenu';
import type { MenuItem } from './MenuPanel';

export type SystemMenuAction =
  | 'dr-eams'
  | 'settings'
  | 'account'
  | 'feed-settings'
  | 'connectors'
  | 'go-home';

type Props = {
  open: boolean;
  onClose: () => void;
  onAction: (action: SystemMenuAction) => void;
  anchorX: number;
  anchorY: number;
  side?: 'left' | 'right';
};

const SYSTEM_ITEMS: Array<{ id: SystemMenuAction; label: string; icon?: string }> = [
  { id: 'dr-eams',       label: 'Dr. Eams',      icon: '◈'  },
  { id: 'settings',      label: 'Settings',      icon: '⚙'  },
  { id: 'account',       label: 'Account',       icon: '👤' },
  { id: 'feed-settings', label: 'Feed',          icon: '📡' },
  { id: 'connectors',    label: 'Connectors',    icon: '🔗' },
  { id: 'go-home',       label: 'Home',          icon: '⌂'  },
];

export default function SystemRadialMenu({ open, onClose, onAction, anchorX, anchorY, side }: Props) {
  const items: MenuItem[] = SYSTEM_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    onSelect: () => onAction(item.id),
  }));

  return (
    <FanMenu
      open={open}
      items={items}
      anchorX={anchorX}
      anchorY={anchorY}
      accent="gold"
      side={side}
      onClose={onClose}
    />
  );
}
