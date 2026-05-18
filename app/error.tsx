'use client'
// SURFACE: dream.overlay.RootError  (framework-mandated basename: error.tsx)

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAuthRelatedError } from '@/lib/runtime/isAuthRelatedError'
import RootStatusScreen from '@/components/overlays/dream.RootStatusScreen';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Route error:', error)

    // Only force sign-out when the error is genuinely session/auth-related
    // (e.g. invalid JWT, expired token, 401/403 from the server).
    // Transient render errors, network blips, or component crashes should
    // NOT destroy the user session — the "Try again" button lets them recover
    // without losing context.
    //
    // Build-memory ref — event "error":
    //   components/dreams/dream.PlatformErrorReporter.tsx
    //   components/gameengin/dream.cartridge.CartridgeErrorBoundary.tsx
    //   engins/engin.CodeEngin.tsx
    if (!isAuthRelatedError(error)) return;

    const sb = createClient();
    sb.auth.signOut().catch(() => { /* best-effort */ }).finally(() => {
      (window.top ?? window).location.href = '/login';
    });
  }, [error])

  return (
    <div>
      <RootStatusScreen
        eyebrow="Recovery"
        title="Something cracked in the dream."
        message="The page hit an error. Try again to recover, or reload if the problem persists."
        detail={error?.message ?? null}
        actions={[{ href: '/', label: 'Go Home' }]}
      />
      <div className="fixed inset-x-4 bottom-4 z-20">
        <button
          onClick={() => reset()}
          className="de-btn de-btn-primary mx-auto flex justify-center"
          style={{ minWidth: 220 }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
