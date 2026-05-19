'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';

interface ProfileWidgetBlockProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  editHref?: string;
  className?: string;
}

export default function ProfileWidgetBlock({
  title,
  icon,
  children,
  editHref,
  className = '',
}: ProfileWidgetBlockProps) {
  return (
    <div
      className={`de-widget-tile ${className}`}
      style={{
        borderRadius: 20,
        padding: 20,
        marginBottom: 14,
        position: 'relative',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
    >
      {/* Widget header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'linear-gradient(135deg, var(--de-gold), var(--de-accent))',
                color: 'white',
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          )}
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--de-heading)',
              letterSpacing: '0.01em',
            }}
          >
            {title}
          </span>
        </div>

        {editHref && (
          <Link
            href={editHref}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'var(--de-mist)',
              border: '1px solid var(--de-border)',
              color: 'var(--de-text-dim)',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            aria-label={`Edit ${title}`}
          >
            <Pencil size={13} />
          </Link>
        )}
      </div>

      {/* Widget content */}
      <div>{children}</div>
    </div>
  );
}
