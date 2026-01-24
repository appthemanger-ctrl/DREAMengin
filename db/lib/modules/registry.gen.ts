/* Auto-generated registry — TS-safe (no JSX) */
import * as React from 'react';

export type WidgetEntry = {
  slug: string;
  name: string;
  Component: React.ComponentType<any>;
};

export const widgetModules: WidgetEntry[] = [
  {
    slug: 'sample-counter',
    name: 'Sample Counter',
    Component: function SampleCounter() {
      return React.createElement(
        'div',
        { className: 'text-sm opacity-70' },
        'Counter widget placeholder'
      );
    }
  }
];
