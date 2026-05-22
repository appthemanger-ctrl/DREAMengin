/**
 * components/shared-dream/index.ts — §38 Shared Dream Collaboration
 *
 * Re-exports all shared-dream components and hooks.
 */

export {
    SharedDreamProvider,
    useSharedDream,
    type SharedDreamContextValue,
    type SharedDreamProviderProps
} from './dream.SharedDreamProvider';

export {
    SharedDreamCanvas,
    type SharedDreamCanvasProps
} from './dream.SharedDreamCanvas';

export { InviteFlow, type InviteFlowProps } from './dream.InviteFlow';

export {
    default as SharedDreamRuntime,
    type SharedDreamRuntimeProps
} from './dream.SharedDreamRuntime';
