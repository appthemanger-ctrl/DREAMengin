import { connectorRegistry, widgetRegistry } from '../../modules/registry.generated';

type WidgetEntry = { slug: string; name: string };
type ConnectorEntry = { slug: string; name: string; impl?: { ingest?: (ctx: any) => Promise<any> } | undefined };

export const widgetModules: WidgetEntry[] =
  Object.keys(widgetRegistry ?? {}).map(slug => ({ slug, name: slug }));

export const connectorModules: ConnectorEntry[] =
  Object.keys(connectorRegistry ?? {}).map(slug => ({ slug, name: slug, impl: undefined }));
