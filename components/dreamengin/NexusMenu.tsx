// NexusMenu.tsx
// System menu overlay opened by double tapping the red control.  Contains
// links to system functions including Dr Eams.

'use client';

import React from 'react';

interface NexusMenuProps {
  onClose: () => void;
  onOpenDrEams: () => void;
}

export default function NexusMenu({ onClose, onOpenDrEams }: NexusMenuProps) {
  const items = [
    { label: 'Search', action: () => {} },
    { label: 'Dr. Eams', action: onOpenDrEams },
    { label: 'Settings', action: () => {} },
    { label: 'Account', action: () => {} },
    { label: 'View All Dreams', action: () => {} },
    { label: 'Edit Layout', action: () => {} },
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg p-4 w-64"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-2">System Menu</h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.label}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => {
                item.action();
                onClose();
              }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
