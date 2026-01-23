// lib/modules/registry.gen.ts
import dynamic from 'next/dynamic';
import { widgetRegistry, connectorRegistry } from '@/modules/registry.generated';
import type { WidgetEntry, ConnectorEntry } from './types';

function labelize(key: string) {
  return key.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Build widgetModules with a real Component so pages can render: mod.Component
export const widgetModules: WidgetEntry[] = Object.keys(widgetRegistry).map((key) => {
  const importer = widgetRegistry[key];
  const Component = dynamic(async () => {
    const mod: any = await importer();
    // prefer default export; fallback to .Widget or .Component
    return (mod && (mod.default || mod.Widget || mod.Component)) || (() => null);
  });
  return {
    slug: key,
    name: labelize(key),
    import: importer,
    Component,
  };
});

export const connectorModules: ConnectorEntry[] = Object.keys(connectorRegistry).map((key) => {
  const importer = connectorRegistry[key];
  const Component = dynamic(async () => {
    const mod: any = await importer();
    return (mod && (mod.default || mod.Widget || mod.Component)) || (() => null);
  });
  return {
    slug: key,
    name: labelize(key),
    import: importer,
    Component,
  };
});
