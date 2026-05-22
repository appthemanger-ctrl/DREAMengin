'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

export default function SlideOverPanel({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 4200, background: 'rgba(2,8,24,0.38)', backdropFilter: 'blur(10px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            style={{ marginLeft: 'auto', height: '100%', width: 'min(520px, 100vw)', background: 'rgba(248,251,255,0.96)', borderLeft: '1px solid rgba(160,195,240,0.24)', boxShadow: '-24px 0 60px rgba(0,0,0,0.22)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="de-widget-header" style={{ padding: 16 }}>
              <span className="de-widget-title">{title}</span>
              <button type="button" className="de-icon-btn" aria-label="Close panel" onClick={onClose}>×</button>
            </div>
            <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 64px)' }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
