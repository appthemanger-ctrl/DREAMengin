// Fallback placeholder. Overwritten at build by scripts/gen-mod-registry.mjs.
export const widgetRegistry = {} as const;
export const connectorRegistry = {} as const;
export type WidgetKey = keyof typeof widgetRegistry;
export type ConnectorKey = keyof typeof connectorRegistry;
