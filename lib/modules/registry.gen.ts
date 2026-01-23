// lib/modules/registry.gen.ts
// Fallback shim. Overwritten at build by scripts/prepare.mjs
export const widgetModules = [];
export const connectorModules = [];
export type WidgetEntry = { slug: string; name: string; load: () => Promise<any>; Component?: any };
export type ConnectorEntry = { slug: string; name: string; load: () => Promise<any>; ingest?: (args:any)=>Promise<any> };
