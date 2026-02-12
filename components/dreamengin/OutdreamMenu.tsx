// OutdreamMenu.tsx
// Dream selection overlay opened by double tapping the blue control.

'use client';

import React from 'react';

interface OutdreamMenuProps {
  onClose: () => void;
}

export default function OutdreamMenu({ onClose }: OutdreamMenuProps) {
  // Placeholder list of day dreams and user dreams.  Replace with dynamic data.
  const dayDreams = [
    { id: 'music', label: 'Music Studio / Releases' },
    { id: 'lab', label: 'Lab: Notes / Simulator' },
    { id: 'games', label: 'Games: Library / Play' },
    { id: 'code', label: 'Code: Space / Preview' },
    { id: 'brand', label: 'Brand: Management / Analytics' },
    { id: 'create', label: 'Create: Projects / Vault' },
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg p-4 w-72"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-2">Dreams</h2>
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {dayDreams.map((d) => (
            <li
              key={d.id}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => {
                // Future: navigate into selected dream
                onClose();
              }}
            >
              {d.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
