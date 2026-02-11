// Mock data for AnchorWidget demonstration
// This provides sample widget instances for testing and demo purposes

import type { WidgetInstanceRecord } from '@/lib/navigation/WidgetInstanceMemory';

/**
 * Generate mock widget instances for demo
 */
export function generateMockWidgetInstances(): WidgetInstanceRecord[] {
  return [
    {
      instanceId: 'widget-home-1',
      ownerId: 'user-1',
      context: 'HOME',
      transformState: { x: 0, y: 0, scale: 1, rotation: 0 },
      zIndex: 1,
      presentation: 'FLOATING' as const,
      bindingType: 'STATIC' as const,
      bindingConfig: {},
      visibility: 'ACTIVE' as const,
      internalState: {}
    },
    {
      instanceId: 'widget-profile-1',
      ownerId: 'user-1',
      context: 'PROFILE',
      transformState: { x: 100, y: 100, scale: 1, rotation: 0 },
      zIndex: 1,
      presentation: 'FLOATING' as const,
      bindingType: 'LIVE' as const,
      bindingConfig: {},
      visibility: 'ACTIVE' as const,
      internalState: {}
    },
    {
      instanceId: 'widget-profile-2',
      ownerId: 'user-1',
      context: 'PROFILE',
      transformState: { x: 200, y: 150, scale: 1, rotation: 0 },
      zIndex: 2,
      presentation: 'FLOATING' as const,
      bindingType: 'LIVE' as const,
      bindingConfig: {},
      visibility: 'ACTIVE' as const,
      internalState: {}
    }
  ];
}
