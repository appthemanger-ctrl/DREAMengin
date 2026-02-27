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
};

const SYSTEM_ITEMS: Array<{ id: SystemMenuAction; label: string; description?: string; icon?: string }> = [
  { id: 'dr-eams',       label: 'Dr. Eams',      icon: '◈', description: 'Your AI dream companion'      },
  { id: 'settings',      label: 'Settings',      icon: '⚙',  description: 'App preferences & controls'  },
  { id: 'account',       label: 'Account',       icon: '👤', description: 'Profile & account details'    },
  { id: 'feed-settings', label: 'Feed Settings', icon: '📡', description: 'Customize your content feed'  },
  { id: 'connectors',    label: 'Connectors',    icon: '🔗', description: 'Connect apps & integrations'  },
  { id: 'go-home',       label: 'Go Home',       icon: '⌂',  description: 'Reset to Home Dream anchor'   },
];

export default function SystemRadialMenu({ open, onClose, onAction }: Props) {
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
      title="System"
      accent="gold"
      items={items}
      onClose={onClose}
    />
  );
}
