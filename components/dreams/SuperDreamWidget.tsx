'use client';

import type { ReactNode } from 'react';

export type SuperDreamLayout = 'auto' | 'stack' | 'grid';

export interface SuperDreamWidgetProps {
  title?: string;
  layout?: SuperDreamLayout;
  children: ReactNode[] | ReactNode;
}

export default function SuperDreamWidget({
  title = 'Super Widget',
  layout = 'auto',
  children,
}: SuperDreamWidgetProps) {
  const items = Array.isArray(children) ? children : [children];
  const resolvedLayout = layout === 'auto' ? (items.length > 2 ? 'grid' : 'stack') : layout;

  return (
    <section className="de-widget" data-super-dream-layout={resolvedLayout}>
      <div className="de-widget-header">
        <span className="de-widget-title">{title}</span>
      </div>
      <div
        className="de-widget-body"
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: resolvedLayout === 'grid' ? 'repeat(2, minmax(0, 1fr))' : '1fr',
        }}
      >
        {items.map((child, index) => (
          <div key={index} className="de-surface" style={{ padding: 12, borderRadius: 14 }}>
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}
