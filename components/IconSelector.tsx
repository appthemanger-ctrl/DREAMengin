'use client';

/**
 * IconSelector - A selector switch component using SVG icons
 *
 * Allows users to switch between different icon options (file, globe, window)
 */

import { useState } from 'react';
import Image from 'next/image';

type IconOption = {
  name: string;
  label: string;
  svgPath: string;
  color: string;
};

const ICON_OPTIONS: IconOption[] = [
  { name: 'file', label: 'Documents', svgPath: '/file.svg', color: '#2A8AB8' },
  { name: 'globe', label: 'Web', svgPath: '/globe.svg', color: '#34d399' },
  { name: 'window', label: 'Apps', svgPath: '/window.svg', color: '#a78bfa' },
];

type Props = {
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: number;
  className?: string;
};

export default function IconSelector({
  defaultValue = 'file',
  onChange,
  size = 44,
  className = ''
}: Props) {
  const [selected, setSelected] = useState(defaultValue);

  const handleSelect = (name: string) => {
    setSelected(name);
    onChange?.(name);
  };

  return (
    <div className={className} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {ICON_OPTIONS.map((option) => {
        const isSelected = selected === option.name;
        return (
          <button
            key={option.name}
            onClick={() => handleSelect(option.name)}
            aria-label={option.label}
            aria-pressed={isSelected}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: size,
              height: size,
              borderRadius: Math.round(size * 0.24),
              background: isSelected ? option.color : 'rgba(80,80,110,0.2)',
              border: isSelected ? `2px solid ${option.color}` : '2px solid transparent',
              flexShrink: 0,
              overflow: 'hidden',
              padding: Math.round(size * 0.20),
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: isSelected ? 'scale(1.1)' : 'scale(1)',
            }}
            title={option.label}
          >
            <Image
              src={option.svgPath}
              alt=""
              width={size}
              height={size}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: isSelected ? 'brightness(0) invert(1)' : 'brightness(0.5)',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
