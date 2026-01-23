/**
 * Registry shim that consumes the generated file at /modules/registry.generated.js
 * and exposes arrays the pages expect.
 */
import * as React from 'react';

let generated;
try {
  generated = await import('@/modules/registry.generated.js');
} catch {
  generated = { widgetRegistry: {}, connectorRegistry: {} };
}

const widgetRegistry = generated.widgetRegistry ?? {};
const connectorRegistry = generated.connectorRegistry ?? {};

// Provide a .Component on each widget entry for compatibility
export const widgetModules = Object.entries(widgetRegistry).map(([slug, loader]) => ({
  slug,
  name: slug.charAt(0).toUpperCase() + slug.slice(1),
  // wrapper that lazy-loads the widget on client
  Component: function WidgetProxy(props) {
    // NOTE: using dynamic loading without hooks to stay safe in server renders
    // We render a placeholder on server, real component hydrates on client via dynamic import
    if (typeof window === 'undefined') return null;
    const [Comp, setComp] = React.useState(null);
    React.useEffect(() => {
      loader().then(mod => setComp(() => mod.default ?? (() => null)));
    }, []);
    if (!Comp) return null;
    return React.createElement(Comp, props);
  }
}));

/**
 * Connectors surface an optional ingest() function.
 */
export const connectorModules = Object.entries(connectorRegistry).map(([slug, loader]) => ({
  slug,
  name: slug,
  ingest: async (ctx) => {
    const mod = await loader();
    return mod.ingest ? mod.ingest(ctx) : null;
  }
}));
