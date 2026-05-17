'use client';

import { useEffect } from 'react';

export default function PlatformErrorReporter( {
  useEffect(() => {
    const report = (message: string, stack?: string, metadata?: Record<string, unknown>) => {
      void fetch('/api/platform/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'client', message, stack, metadata }),
      }).catch(() => undefined);
    };
    const onError = (event: ErrorEvent) => report(event.message, event.error?.stack, { filename: event.filename, lineno: event.lineno });
    const onRejection = (event: PromiseRejectionEvent) => report(String(event.reason?.message ?? event.reason ?? 'Unhandled rejection'), event.reason?.stack);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
