'use client';

import React, { ReactNode, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DreamWidgetProps {
  type?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  isEmpty?: boolean;
  onOpen?: () => void;
  onLongPress?: () => void;
  className?: string;
  children?: ReactNode;
}

export default function DreamWidget({
  title,
  subtitle,
  icon,
  isEmpty = false,
  onOpen,
  onLongPress,
  className,
  children,
}: DreamWidgetProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPress = () => {
    if (!onLongPress) return;
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      onLongPress();
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  if (isEmpty) {
    return (
      <motion.div
        whileTap={onOpen ? { scale: 0.97 } : {}}
        className={cn(
          'dream-widget-card dream-widget-empty',
          onOpen ? 'cursor-pointer' : '',
          className
        )}
        onClick={onOpen}
        role={onOpen ? 'button' : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onKeyDown={onOpen ? (e) => e.key === 'Enter' && onOpen() : undefined}
      >
        {icon && (
          <div className="w-10 h-10 flex items-center justify-center text-de-sky/30 mb-2">
            {icon}
          </div>
        )}
        <p className="text-xs font-light text-de-sky/25 tracking-wide">{title}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileTap={onOpen ? { scale: 0.97 } : {}}
      className={cn(
        'dream-widget-card group p-5',
        onOpen ? 'cursor-pointer' : '',
        className
      )}
      onClick={onOpen}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onPointerLeave={cancelLongPress}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={onOpen ? (e) => e.key === 'Enter' && onOpen() : undefined}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-de-sky/5 via-transparent to-de-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

      {/* Main content */}
      <div className="relative z-10">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-de-sky/15 to-de-gold/10 flex items-center justify-center text-de-sky">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white/90 truncate text-sm leading-snug">{title}</h3>
            {subtitle && (
              <p className="text-xs text-de-sky/55 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {children && (
          <div className="mt-3 text-xs text-white/60 leading-relaxed">{children}</div>
        )}
      </div>

      {/* Decorative corner accent — gold/sky gradient, bottom-right */}
      <div className="absolute bottom-0 right-0 w-14 h-14 bg-gradient-to-tl from-de-gold/10 via-de-sky/5 to-transparent rounded-tl-3xl pointer-events-none" />
    </motion.div>
  );
}
