'use client';

import React from 'react';
import RadialMenu from './RadialMenu';

export type SystemMenuAction =
  | 'search'
  | 'dr-eams'
  | 'settings'
  | 'appearance'
  | 'account'
  | 'view-all-dreams'
  | 'edit-layout';

type Props = {
  open: boolean;
  anchor: DOMRect | null;
  onClose: () => void;
  onAction: (action: SystemMenuAction) => void;
};

const SYSTEM_ITEMS: Array<{ id: SystemMenuAction; label: string }> = [
  { id: 'search',          label: 'Search'     },
  { id: 'dr-eams',         label: 'Dr.Eams'    },
  { id: 'appearance',      label: 'Appearance'  },
  { id: 'settings',        label: 'Settings'    },
  { id: 'account',         label: 'Account'     },
  { id: 'view-all-dreams', label: 'View All'    },
];

export default function SystemRadialMenu({ open, anchor, onClose, onAction }: Props) {
  return (
    <RadialMenu
      open={open}
      anchor={anchor}
      onClose={onClose}
      variant="red"
      items={SYSTEM_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        onSelect: () => onAction(item.id),
      }))}
    />
  );
}
