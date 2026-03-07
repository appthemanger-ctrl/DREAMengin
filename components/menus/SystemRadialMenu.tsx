'use client';

import React from 'react';
import MenuPanel, { type MenuItem } from './MenuPanel';

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
  side?: 'left' | 'right' | 'center';
};

const SYSTEM_ITEMS: Array<{ id: SystemMenuAction; label: string; description?: string; icon?: string }> = [
  { id: 'dr-eams',       label: 'Dr. Eams',          icon: '◈', description: 'Your AI dream companion'            },
  { id: 'settings',      label: 'Settings',          icon: '⚙',  description: 'App preferences & controls'         },
  { id: 'account',       label: 'Edit ProfileDream', icon: '👤', description: 'Build your profile — private builder' },
  { id: 'feed-settings', label: 'Feed Settings',     icon: '📡', description: 'Customize your content feed'         },
  { id: 'connectors',    label: 'Connectors',        icon: '🔗', description: 'Connect apps & integrations'         },
  { id: 'go-home',       label: 'HomeDream',         icon: '⌂',  description: 'Return to your HomeDream'            },
];

export default function SystemRadialMenu({ open, onClose, onAction, side }: Props) {
  const items: MenuItem[] = SYSTEM_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description,
    icon: item.icon,
    onSelect: () => onAction(item.id),
  }));

  return (
    <MenuPanel
      open={open}
      title="DreamMenu"
      accent="gold"
      items={items}
      onClose={onClose}
      side={side}
    />
  );
}
