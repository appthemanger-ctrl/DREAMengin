'use client';
// components/BoogieWarningBanner.tsx
// Warning UI component used whenever TheBoogieMan.AI issues an enforcement action.
// Includes "Why was I warned?" (req 12) and "Appeal" (req 13) links.
// Uses factual, calm tone (req H64). Never reveals internals (req H63).

import Link from 'next/link';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import type { PolicyResult } from '@/lib/policy/boogiePolicy';

interface BoogieWarningBannerProps {
  /** The PolicyResult that triggered this warning. */
  result: PolicyResult;
  /** Allow dismissing low-severity (S0/S1) banners. High severity banners are not dismissible. */
  dismissible?: boolean;
  /** Optional class name for the outer container. */
  className?: string;
}

const SEVERITY_STYLES: Record<string, { border: string; icon: string; badge: string; label: string }> = {
  S0_NOTICE: {
    border: 'rgba(42,138,184,0.25)',
    icon: '#2a8ab8',
    badge: 'rgba(42,138,184,0.1)',
    label: 'Notice',
  },
  S1_SOFT_WARN: {
    border: 'rgba(245,158,11,0.3)',
    icon: '#f59e0b',
    badge: 'rgba(245,158,11,0.1)',
    label: 'Warning',
  },
  S2_HARD_WARN: {
    border: 'rgba(245,158,11,0.5)',
    icon: '#f59e0b',
    badge: 'rgba(245,158,11,0.15)',
    label: 'Warning',
  },
  S3_FEATURE_LOCK: {
    border: 'rgba(220,68,68,0.35)',
    icon: '#dc4444',
    badge: 'rgba(220,68,68,0.1)',
    label: 'Feature Locked',
  },
  S4_TEMP_BAN: {
    border: 'rgba(220,68,68,0.5)',
    icon: '#dc4444',
    badge: 'rgba(220,68,68,0.15)',
    label: 'Temporary Ban',
  },
  S5_PERM_BAN: {
    border: 'rgba(139,0,0,0.5)',
    icon: '#8b0000',
    badge: 'rgba(139,0,0,0.1)',
    label: 'Account Restricted',
  },
};

/**
 * BoogieWarningBanner
 *
 * Renders a policy enforcement banner with:
 * - What happened (plain language)
 * - Why (rule/category)
 * - "Why was I warned?" link → /policy (req 12)
 * - "Appeal" link → /policy#appeals (req 13)
 * - Expiry countdown if applicable
 */
export default function BoogieWarningBanner({
  result,
  dismissible = true,
  className = '',
}: BoogieWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const canDismiss = dismissible && (result.severity === 'S0_NOTICE' || result.severity === 'S1_SOFT_WARN');
  const isAppealable = !['S0_NOTICE', 'S1_SOFT_WARN'].includes(result.severity);

  if (dismissed) return null;

  const style = SEVERITY_STYLES[result.severity] ?? SEVERITY_STYLES.S1_SOFT_WARN;

  const expiryText = result.expires_at
    ? (() => {
        const ms = new Date(result.expires_at).getTime() - Date.now();
        if (ms <= 0) return null;
        const hours = Math.ceil(ms / 3_600_000);
        return hours < 24 ? `Expires in ${hours}h` : `Expires in ${Math.ceil(hours / 24)}d`;
      })()
    : null;

  return (
    <div
      role="alert"
      className={`de-widget ${className}`}
      style={{ borderColor: style.border, borderWidth: 1, borderStyle: 'solid' }}
    >
      <div className="de-widget-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle className="w-4 h-4" style={{ color: style.icon }} />
          <span className="de-widget-title" style={{ color: style.icon }}>
            {style.label}
          </span>
          {expiryText && (
            <span
              style={{
                fontSize: 10,
                fontFamily: 'monospace',
                color: style.icon,
                background: style.badge,
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              {expiryText}
            </span>
          )}
        </div>
        {canDismiss && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            style={{ padding: 4, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X className="w-3 h-3" style={{ color: 'var(--de-text-dim)' }} />
          </button>
        )}
      </div>

      <div className="de-widget-body" style={{ paddingTop: 6 }}>
        <p style={{ fontSize: 13, color: 'var(--de-text)', lineHeight: 1.6 }}>
          {result.reason}
        </p>
        {result.category !== 'NONE' && (
          <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginTop: 4 }}>
            Category: <span style={{ fontFamily: 'monospace', color: style.icon }}>{result.category}</span>
            {result.policy_ref && (
              <> · Rule: <span style={{ fontFamily: 'monospace', color: style.icon }}>{result.policy_ref}</span></>
            )}
          </p>
        )}
      </div>

      <div className="de-widget-actions" style={{ gap: 8 }}>
        {/* "Why was I warned?" link (req 12) */}
        <Link
          href="/policy"
          className="de-btn de-btn-ghost text-xs"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <ExternalLink className="w-3 h-3" />
          Why was I warned?
        </Link>

        {/* "Appeal" link → /policy#appeals (req 13) */}
        {isAppealable && (
          <Link
            href="/policy#appeals"
            className="de-btn de-btn-primary text-xs"
          >
            Appeal
          </Link>
        )}
      </div>
    </div>
  );
}
