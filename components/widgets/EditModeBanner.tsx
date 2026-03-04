'use client';

import React from 'react';
import { useEditMode } from './EditModeProvider';

export default function EditModeBanner() {
  const { isEditing, exitEdit } = useEditMode();
  if (!isEditing) return null;
  return (
    <>
      <div className="de-edit-mode-banner" />
      <div
        style={{
          position: 'fixed',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 71,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '5px 6px 5px 14px',
          borderRadius: 9999,
          background: 'rgba(200,152,26,0.15)',
          border: '1px solid var(--de-gold)',
          color: 'var(--de-gold)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        ✏️ EDIT MODE
        <button
          type="button"
          onClick={exitEdit}
          style={{
            padding: '4px 12px',
            borderRadius: 9999,
            background: 'var(--de-gold)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Done
        </button>
      </div>
    </>
  );
}
