'use client';

/**
 * components/gameengin/CartridgeErrorBoundary.tsx
 *
 * React error boundary that catches render/lifecycle exceptions from a
 * mounted cartridge and surfaces them via `onCrash`. Also subscribes to
 * `window.error` and `unhandledrejection` so async runtime crashes from
 * the Babylon scene / WASM trap also open the crash window.
 *
 * The boundary itself renders a tombstone placeholder so the page remains
 * usable while the player writes their report.
 */

import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';

export interface CartridgeCrashEvent {
  name?: string;
  message?: string;
  stack?: string;
}

interface BoundaryProps {
  cartridgeId: string;
  onCrash: (e: CartridgeCrashEvent) => void;
  children: ReactNode;
}
interface BoundaryState {
  crashed: boolean;
}

export class CartridgeErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { crashed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onCrash({
      name: error.name,
      message: error.message,
      stack: error.stack ?? info.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.crashed) {
      return (
        <div
          role="alert"
          data-testid="gameengin-crash-tombstone"
          style={{ padding: 32, color: '#fca5a5', fontSize: 13, textAlign: 'center' }}
        >
          ⚠️ Cartridge stopped. The crash window has been opened so you can tell Maestro what happened.
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Subscribes to global `error` / `unhandledrejection` events while mounted
 * and forwards them to `onCrash`. Use alongside `CartridgeErrorBoundary` so
 * async crashes (Babylon render loop, WASM traps, fetch rejections) also
 * surface the report window.
 */
export function useGlobalCrashListener(active: boolean, onCrash: (e: CartridgeCrashEvent) => void) {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return;
    function handleError(ev: ErrorEvent) {
      onCrash({
        name: ev.error?.name ?? 'Error',
        message: ev.error?.message ?? ev.message,
        stack: ev.error?.stack,
      });
    }
    function handleRejection(ev: PromiseRejectionEvent) {
      const r = ev.reason;
      onCrash({
        name: r?.name ?? 'UnhandledRejection',
        message: r?.message ?? (typeof r === 'string' ? r : 'Promise rejected'),
        stack: r?.stack,
      });
    }
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [active, onCrash]);
}
