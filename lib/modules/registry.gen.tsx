import React from 'react';

export type WidgetEntry = {
  slug: string;
  name: string;
  Component: React.ComponentType<any>;
};

const SampleCounter: React.FC = () => (
  <div className="text-sm opacity-70">Counter widget placeholder</div>
);

export const widgetModules: WidgetEntry[] = [
  { slug: 'sample-counter', name: 'Sample Counter', Component: SampleCounter }
];
