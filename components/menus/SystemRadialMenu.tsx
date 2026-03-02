'use client';

import React from 'react';
import { BrainCircuit, Settings2, CircleUser, Rss, PlugZap, Home } from 'lucide-react';
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

const SYSTEM_ITEMS: Array<{ id: SystemMenuAction; label: string; icon: React.ReactNode }> = [
  { id: 'dr-eams',       label: 'Dr. Eams',   icon: <BrainCircuit size={22} /> },
  { id: 'settings',      label: 'Settings',   icon: <Settings2 size={22} />    },
  { id: 'account',       label: 'Account',    icon: <CircleUser size={22} />   },
  { id: 'feed-settings', label: 'Feed',       icon: <Rss size={22} />          },
  { id: 'connectors',    label: 'Connectors', icon: <PlugZap size={22} />      },
  { id: 'go-home',       label: 'Home',       icon: <Home size={22} />         },
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
