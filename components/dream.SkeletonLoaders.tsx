'use client';

/**
 * SkeletonLoaders — branded shimmer skeletons matching DREAMengin glass design system.
 *
 * Uses CSS-only shimmer via the de-skeleton class defined in styles/globals.css.
 * Architecture: THEME.md (Gold=action · Sky-blue=connected · White=clarity)
 */

export function FeedCardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--de-glass, rgba(255,255,255,0.60))',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid var(--de-border, rgba(180,185,200,0.35))',
        borderRadius: 'var(--de-radius-xl, 24px)',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ padding: '20px' }}>
        {/* Author row skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            className="de-skeleton"
            style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div
              className="de-skeleton"
              style={{ width: 120, height: 12, borderRadius: 6, marginBottom: 8 }}
            />
            <div
              className="de-skeleton"
              style={{ width: 80, height: 10, borderRadius: 5 }}
            />
          </div>
        </div>

        {/* Content skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <div className="de-skeleton" style={{ width: '100%', height: 12, borderRadius: 6 }} />
          <div className="de-skeleton" style={{ width: '85%', height: 12, borderRadius: 6 }} />
          <div className="de-skeleton" style={{ width: '65%', height: 12, borderRadius: 6 }} />
        </div>

        {/* Image skeleton */}
        <div
          className="de-skeleton"
          style={{
            width: '100%',
            height: 180,
            borderRadius: 'var(--de-radius-md, 14px)',
            marginBottom: 16,
          }}
        />

        {/* Action buttons skeleton */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="de-skeleton" style={{ width: 72, height: 32, borderRadius: 999 }} />
          <div className="de-skeleton" style={{ width: 72, height: 32, borderRadius: 999 }} />
          <div className="de-skeleton" style={{ width: 36, height: 32, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function WidgetSkeleton() {
  return (
    <div
      style={{
        background: 'var(--de-glass, rgba(255,255,255,0.60))',
        backdropFilter: 'blur(18px) saturate(155%)',
        WebkitBackdropFilter: 'blur(18px) saturate(155%)',
        border: '1px solid var(--de-border, rgba(180,185,200,0.35))',
        borderRadius: 'var(--de-radius-lg, 18px)',
        padding: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div className="de-skeleton" style={{ width: '60%', height: 14, borderRadius: 7, marginBottom: 14 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="de-skeleton" style={{ width: '100%', height: 10, borderRadius: 5 }} />
        <div className="de-skeleton" style={{ width: '80%', height: 10, borderRadius: 5 }} />
      </div>
    </div>
  );
}
