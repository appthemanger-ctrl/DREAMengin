'use client';
/**
 * components/widgets/WidgetCard.tsx
 *
 * @deprecated Forwarding shim — canonical implementation is DreamShell at
 *   components/dreams/DreamShell.tsx (Phase 8 §B Point 18).
 *
 * Preserved for backward-compatibility with existing callers.
 * Wraps content in DreamShell while maintaining WidgetCard's prop interface.
 * New code should use DreamShell directly.
 *
 * Architecture: docs/ARCHITECTURE.md §4 (Universal Dream Window model)
 * Phase 8 Section B: Point 18 — legacy widget naming absorbed.
 */

import React from 'react';
import DreamShell from '@/components/dreams/DreamShell';

/** @deprecated Use DreamShell from components/dreams/DreamShell.tsx */
export interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onConfigure?: () => void;
  onHide?: () => void;
  onRemove?: () => void;
  isPinned?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * @deprecated Use DreamShell directly.
 * This shim delegates to DreamShell while exposing the legacy WidgetCard interface.
 */
export default function WidgetCard({
  title,
  children,
  onConfigure,
  onHide,
  onRemove,
  className,
  style,
}: WidgetCardProps) {
  return (
    <DreamShell
      widgetId={title.toLowerCase().replace(/\s+/g, '-')}
      title={title}
      icon="✦"
      dataState="ready"
      onConfigure={onConfigure}
      onHide={onHide}
      onRemove={onRemove}
      className={className}
      style={style}
    >
      {children}
    </DreamShell>
  );
}
