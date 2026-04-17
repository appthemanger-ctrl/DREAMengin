/**
 * components/shared-dream/index.ts — §38 Shared Dream Collaboration
 *
 * Re-exports all shared-dream components and hooks.
 */

export {
  SharedDreamProvider,
  useSharedDream,
  type SharedDreamContextValue,
  type SharedDreamProviderProps,
} from './SharedDreamProvider';

export {
  SharedDreamCanvas,
  type SharedDreamCanvasProps,
} from './SharedDreamCanvas';

export { InviteFlow, type InviteFlowProps } from './InviteFlow';
