// Stable import for pages. Generated mapping lives in modules/registry.generated.js
import { widgetRegistry as wr, connectorRegistry as cr } from '@/modules/registry.generated.js';

export const widgetModules = Object.entries(wr).map(([slug, loader]) => ({ slug, name: slug, loader }));
export const connectorModules = Object.entries(cr).map(([slug, loader]) => ({ slug, name: slug, loader }));
