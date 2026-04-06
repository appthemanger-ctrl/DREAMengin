import { ALL_CONNECTION_PATHS } from '@/lib/dream-window/enginConnectionNetwork';
import { ENGIN_REGISTRY } from '@/lib/forge/forgeRegistry';
import { AI_AGENTS, AI_ROUTES } from '@/lib/identity/canonical-names';
import { CONNECTOR_REGISTRY } from '@/lib/connectors/connectorRegistry';
import { WIDGET_REGISTRY } from '@/lib/widgets/widgetRegistry';

export type DreamenginOSSubsystemFamily =
  | 'ai'
  | 'daydreams'
  | 'engins'
  | 'connectors'
  | 'dream-windows'
  | 'assets'
  | 'runtime'
  | 'network'
  | 'moderation'
  | 'observability';

export interface DreamenginOSSubsystemNode {
  id: string;
  label: string;
  family: DreamenginOSSubsystemFamily;
  detail: string;
  route?: string;
  apiRoute?: string;
  capabilities: readonly string[];
  runtimePresence: 'surface' | 'dream' | 'both' | 'global';
  connectionIds?: readonly string[];
}

export interface DreamenginOSSubsystemFamilySummary {
  id: DreamenginOSSubsystemFamily;
  label: string;
  count: number;
  primaryRoute?: string;
  nodes: readonly DreamenginOSSubsystemNode[];
}

export interface DreamenginOSSubsystemManifest {
  nodes: readonly DreamenginOSSubsystemNode[];
  families: readonly DreamenginOSSubsystemFamilySummary[];
}

const DAYDREAM_ROUTES = {
  Music: '/daydream/music',
  Games: '/daydream/games',
  Lab: '/daydream/lab',
  Code: '/daydream/code',
  Brand: '/daydream/brand',
  Create: '/daydream/create',
} as const;

const FAMILY_LABELS: Record<DreamenginOSSubsystemFamily, string> = {
  ai: 'AI',
  daydreams: 'Daydreams',
  engins: 'Engins',
  connectors: 'Connectors',
  'dream-windows': 'Dream Windows',
  assets: 'Assets',
  runtime: 'Runtime',
  network: 'Connection Network',
  moderation: 'Moderation',
  observability: 'Observability',
};

function uniquePathsForNode(predicate: (path: (typeof ALL_CONNECTION_PATHS)[number]) => boolean) {
  return ALL_CONNECTION_PATHS.filter(predicate).map((path) => path.id);
}

function verbsForDaydream(label: keyof typeof DAYDREAM_ROUTES) {
  return ALL_CONNECTION_PATHS
    .filter((path) => path.daydreamSurface === label)
    .map((path) => path.verb);
}

export function buildDreamenginOSSubsystemManifest(): DreamenginOSSubsystemManifest {
  const aiNodes: DreamenginOSSubsystemNode[] = [
    {
      id: 'ai:dr-eams',
      label: AI_AGENTS.DR_EAMS,
      family: 'ai',
      detail: 'User-facing contextual copilot for code, content, and navigation.',
      route: '/messages',
      apiRoute: AI_ROUTES[AI_AGENTS.DR_EAMS],
      capabilities: ['contextual help', 'navigation intents', 'creative assist'],
      runtimePresence: 'both',
    },
    {
      id: 'ai:idari',
      label: AI_AGENTS.IDARI,
      family: 'ai',
      detail: 'Admin/operator intelligence for diagnostics, fixes, and oversight.',
      apiRoute: AI_ROUTES[AI_AGENTS.IDARI],
      capabilities: ['admin guard', 'diagnostics', 'patch planning'],
      runtimePresence: 'global',
    },
    {
      id: 'ai:the-boogieman',
      label: AI_AGENTS.THE_BOOGIEMAN,
      family: 'moderation',
      detail: 'Policy, privacy, and safety enforcement across the OS graph.',
      route: '/settings/safety',
      apiRoute: AI_ROUTES[AI_AGENTS.THE_BOOGIEMAN],
      capabilities: ['privacy enforcement', 'harm prevention', 'runtime audit'],
      runtimePresence: 'global',
    },
    {
      id: 'ai:triad-consensus',
      label: 'Triad Consensus',
      family: 'ai',
      detail: 'Combined multi-agent operating mode across Dr. Eams, IDARi, and TheBoogieMan.',
      route: '/messages',
      capabilities: ['cross-agent arbitration', 'multi-step workflow support', 'safety gating'],
      runtimePresence: 'both',
    },
  ];

  const daydreamNodes: DreamenginOSSubsystemNode[] = Object.entries(DAYDREAM_ROUTES).map(
    ([label, route]) => ({
      id: `daydream:${label.toLowerCase()}`,
      label: `${label} Daydream`,
      family: 'daydreams' as const,
      detail: `${label} surface connected through the DreamSpace operating layer.`,
      route,
      capabilities: verbsForDaydream(label as keyof typeof DAYDREAM_ROUTES),
      runtimePresence: 'both' as const,
      connectionIds: uniquePathsForNode((path) => path.daydreamSurface === label),
    }),
  );

  const enginNodes: DreamenginOSSubsystemNode[] = ENGIN_REGISTRY.map((engin) => ({
    id: `engin:${engin.id}`,
    label: engin.name,
    family: 'engins',
    detail: engin.desc,
    route: engin.daydreamHref,
    capabilities: engin.capabilities,
    runtimePresence: 'both',
    connectionIds: uniquePathsForNode((path) => path.enginRuntime === engin.name),
  }));

  const connectorNodes: DreamenginOSSubsystemNode[] = CONNECTOR_REGISTRY.map((connector) => ({
    id: `connector:${connector.id}`,
    label: connector.name,
    family: 'connectors',
    detail: connector.whatYouGet,
    route: '/connectors',
    capabilities: connector.sliceTypes.map((slice) => slice.label),
    runtimePresence: 'global',
  }));

  const dreamWindowNodes: DreamenginOSSubsystemNode[] = [
    {
      id: 'dream-window:widget-registry',
      label: 'Dream Window Registry',
      family: 'dream-windows',
      detail: 'Dream Window library and stable subsystem module definitions.',
      route: '/settings/widgets',
      capabilities: WIDGET_REGISTRY.map((widget) => widget.title),
      runtimePresence: 'both',
    },
  ];

  const assetNodes: DreamenginOSSubsystemNode[] = [
    {
      id: 'asset:gal',
      label: 'Global Association Layer',
      family: 'assets',
      detail: 'Everything-to-everything asset graph and registry synchronization.',
      route: '/settings/data',
      capabilities: ['global registry', 'asset discovery', 'realtime sync'],
      runtimePresence: 'global',
    },
  ];

  const runtimeNodes: DreamenginOSSubsystemNode[] = [
    {
      id: 'runtime:dual-runtime',
      label: 'Dual Runtime',
      family: 'runtime',
      detail: 'Persistent two-region operating context split by the DreamDM seam.',
      capabilities: ['surface space', 'dreamspace', 'split workflow'],
      runtimePresence: 'both',
    },
    {
      id: 'runtime:dreamdm-seam',
      label: 'DreamDM Seam',
      family: 'runtime',
      detail: 'Spatial divider, focus control, and live runtime blend.',
      capabilities: ['divider drag', 'split control', 'dominant runtime'],
      runtimePresence: 'both',
    },
    {
      id: 'runtime:dispatcher',
      label: 'Engin Dispatcher',
      family: 'runtime',
      detail: 'Shared worker, memory, and seam telemetry orchestration.',
      capabilities: ['SAB memory', 'worker pool', 'telemetry'],
      runtimePresence: 'global',
    },
  ];

  const networkNodes: DreamenginOSSubsystemNode[] = [
    {
      id: 'network:engin-connections',
      label: 'Engin Connection Network',
      family: 'network',
      detail: 'Canonical cross-Daydream and cross-Engin routing graph.',
      capabilities: ALL_CONNECTION_PATHS.map((path) => path.label),
      runtimePresence: 'both',
    },
    {
      id: 'observability:runtime-graph',
      label: 'Runtime Observability',
      family: 'observability',
      detail: 'Immediate remediation, subsystem visibility, and live runtime health.',
      route: '/settings/data',
      capabilities: ['runtime health', 'audit trail', 'immediate action'],
      runtimePresence: 'global',
    },
  ];

  const nodes: DreamenginOSSubsystemNode[] = [
    ...aiNodes,
    ...daydreamNodes,
    ...enginNodes,
    ...connectorNodes,
    ...dreamWindowNodes,
    ...assetNodes,
    ...runtimeNodes,
    ...networkNodes,
  ];

  const families = (Object.keys(FAMILY_LABELS) as DreamenginOSSubsystemFamily[]).map((family) => {
    const familyNodes = nodes.filter((node) => node.family === family);
    return {
      id: family,
      label: FAMILY_LABELS[family],
      count: familyNodes.length,
      primaryRoute: familyNodes.find((node) => node.route)?.route,
      nodes: familyNodes,
    };
  }).filter((family) => family.count > 0);

  return {
    nodes,
    families,
  };
}

export const DREAMENGIN_OS_SUBSYSTEM_MANIFEST = buildDreamenginOSSubsystemManifest();
