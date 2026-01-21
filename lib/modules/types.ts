
import type { ComponentType } from 'react';
export type WidgetModule = { name: string; slug: string; Component: ComponentType<any> };
export type ConnectorModule = { name: string; slug: string; impl: { ingest?: (args: { userId: string }) => Promise<void> } };
