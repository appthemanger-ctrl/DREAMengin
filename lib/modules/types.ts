// lib/modules/types.ts
import type { ComponentType } from 'react';

export type ModuleEntry<T = any> = {
  slug: string;           // machine key, e.g. 'promo'
  name: string;           // human label, e.g. 'Promo'
  import?: () => Promise<T>; // optional dynamic import
  Component?: ComponentType<any>; // OPTIONAL direct component for rendering
};

export type WidgetEntry = ModuleEntry;
export type ConnectorEntry = ModuleEntry;
