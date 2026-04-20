'use client';

/**
 * ToastSystem — glass-surface toasts matching DREAMengin design language.
 *
 * Architecture: THEME.md (Gold=action · Sky-blue=connected · White=clarity)
 * Uses inline styles for self-contained rendering with zero CSS class deps.
 */

import { useState, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string, duration: number = 5000) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, type, message, duration };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 380,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => onRemove(toast.id)}
          index={index}
        />
      ))}
    </div>
  );
}

const TOAST_CONFIG: Record<ToastType, { color: string; bg: string; border: string; accent: string }> = {
  success: {
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.08)',
    border: 'rgba(22,163,74,0.22)',
    accent: 'rgba(22,163,74,0.5)',
  },
  error: {
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.22)',
    accent: 'rgba(220,38,38,0.5)',
  },
  warning: {
    color: '#c8981a',
    bg: 'rgba(200,152,26,0.08)',
    border: 'rgba(200,152,26,0.22)',
    accent: 'rgba(200,152,26,0.5)',
  },
  info: {
    color: '#2a8ab8',
    bg: 'rgba(42,138,184,0.08)',
    border: 'rgba(42,138,184,0.22)',
    accent: 'rgba(42,138,184,0.5)',
  },
};

function ToastItem({ toast, onRemove, index }: { toast: Toast; onRemove: () => void; index: number }) {
  const [isExiting, setIsExiting] = useState(false);
  const config = TOAST_CONFIG[toast.type];

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(onRemove, 250);
  };

  const getIcon = () => {
    const style = { width: 18, height: 18, color: config.color, flexShrink: 0 as const };
    switch (toast.type) {
      case 'success': return <CheckCircle style={style} />;
      case 'error':   return <XCircle style={style} />;
      case 'warning': return <AlertCircle style={style} />;
      case 'info':    return <Info style={style} />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 16,
        pointerEvents: 'auto',
        background: 'var(--de-glass, rgba(255,255,255,0.60))',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: `1px solid ${config.border}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 12px ${config.bg}`,
        transform: isExiting
          ? 'translateX(110%) scale(0.95)'
          : `translateX(0) translateY(${index * 2}px)`,
        opacity: isExiting ? 0 : 1,
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
        animation: isExiting ? 'none' : 'de-toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${config.accent}, transparent)`,
        }}
        aria-hidden="true"
      />

      <div style={{ marginTop: 1 }}>{getIcon()}</div>
      <p
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--de-heading, #0f1e34)',
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {toast.message}
      </p>
      <button
        onClick={handleRemove}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: 8,
          border: 'none',
          background: 'rgba(0,0,0,0.04)',
          cursor: 'pointer',
          color: 'var(--de-text-dim)',
          flexShrink: 0,
          transition: 'background 0.12s',
          padding: 0,
        }}
        aria-label="Dismiss notification"
      >
        <X style={{ width: 14, height: 14 }} />
      </button>

      <style>{`
        @keyframes de-toast-in {
          from {
            opacity: 0;
            transform: translateX(80px) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
