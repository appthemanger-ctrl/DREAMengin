'use client';

/**
 * components/gameengin/dream.cartridge.CartridgeLauncher.tsx
 *
 * Mounts a single GameEngin cartridge via the platform's GameRuntime host.
 * Used by /gameengin/cartridges/[id]. On unmount the runtime cleans up the
 * cartridge automatically.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import GameRuntime from '@/lib/gameengin/GameRuntime';
import { loadCartridge } from '@/lib/gameengin/cartridges/loaders';
import type { GameCartridge, GravityPreset } from '@/lib/gameengin/cartridge';
import type { CartridgeManifestEntry } from '@/lib/gameengin/cartridges/manifest';
import CrashReportModal, { type CrashContext } from './dream.CrashReportModal';
import { CartridgeErrorBoundary, useGlobalCrashListener, type CartridgeCrashEvent } from './dream.cartridge.CartridgeErrorBoundary';

export interface CartridgeLauncherProps {
  manifest: CartridgeManifestEntry;
  /** Initial gravity preset for the cartridge (defaults to 'earth'). */
  gravity?: GravityPreset;
  /** Initial 0–1 friction value (defaults to 0.5). */
  friction?: number;
}

export default function CartridgeLauncher({
  manifest,
  gravity = 'earth',
  friction = 0.5,
}: CartridgeLauncherProps) {
  const [cartridge, setCartridge] = useState<GameCartridge | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [crash, setCrash] = useState<CrashContext | null>(null);

  const handleCrash = useCallback((e: CartridgeCrashEvent) => {
    setCrash((prev) => prev ?? {
      cartridgeId: manifest.id,
      cartridgeLabel: manifest.label,
      error: e,
    });
  }, [manifest.id, manifest.label]);

  useGlobalCrashListener(cartridge !== null && crash === null, handleCrash);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setCartridge(null);
    loadCartridge(manifest.id)
      .then((c) => {
        if (cancelled) return;
        if (!c) {
          setError(`No loader registered for cartridge "${manifest.id}".`);
          return;
        }
        setCartridge(c);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load cartridge.');
      });
    return () => { cancelled = true; };
  }, [manifest.id]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0a1226 0%, #04060f 60%, #02030a 100%)',
      color: '#e8eef9',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 64px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Link
            href="/gameengin/cartridges"
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              color: '#94a3b8', textDecoration: 'none',
              padding: '6px 12px', borderRadius: 999,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            ← Cartridges
          </Link>
          <span style={{ fontSize: 28, lineHeight: 1 }}>{manifest.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: manifest.color, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {manifest.category} · {manifest.renderMode} · {manifest.tier}
            </div>
            <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 900, color: '#f5f8ff' }}>{manifest.label}</h1>
          </div>
        </div>

        {manifest.subtitle && (
          <p style={{ margin: '0 0 6px', fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>{manifest.subtitle}</p>
        )}
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#94a3b8', lineHeight: 1.55 }}>{manifest.description}</p>

        {/* Runtime host */}
        <div style={{
          borderRadius: 14, overflow: 'hidden',
          border: `1px solid ${manifest.color}33`,
          boxShadow: `0 18px 48px ${manifest.color}1c`,
          background: '#02030a',
          minHeight: 480,
        }}>
          {error ? (
            <div style={{ padding: 32, color: '#fca5a5', fontSize: 13 }}>
              ⚠️ {error}
            </div>
          ) : !cartridge ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
              Loading cartridge…
            </div>
          ) : (
            <CartridgeErrorBoundary cartridgeId={manifest.id} onCrash={handleCrash}>
              <GameRuntime
                cartridge={cartridge}
                physicsConfig={{ gravity, friction }}
              />
            </CartridgeErrorBoundary>
          )}
        </div>

        <CrashReportModal
          open={crash !== null}
          context={crash}
          onClose={() => setCrash(null)}
        />

        <div style={{
          marginTop: 14, fontSize: 10, color: '#475569',
          letterSpacing: '0.06em', textAlign: 'center',
        }}>
          Cartridge id: <code style={{ color: '#94a3b8' }}>{manifest.id}</code>
          {'  ·  '}
          Hosted on the GameEngin platform · 60 fps target · adaptive quality budget · quick-resume capable
        </div>
      </div>
    </div>
  );
}
