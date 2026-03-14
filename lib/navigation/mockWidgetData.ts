// Mock data for AnchorWidget demonstration
// This provides sample widget instances for testing and demo purposes

import type { WidgetInstanceRecord } from '@/lib/navigation/WidgetInstanceMemory';
import { WidgetPresentation, WidgetBindingType, WidgetVisibility } from '@/lib/navigation/WidgetInstanceMemory';

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
      presentation: WidgetPresentation.FLOATING,
      bindingType: WidgetBindingType.STATIC,
      bindingConfig: {},
      visibility: WidgetVisibility.ACTIVE,
      internalState: {}
    },
    {
      instanceId: 'widget-profile-1',
      ownerId: 'user-1',
      context: 'PROFILE',
      transformState: { x: 100, y: 100, scale: 1, rotation: 0 },
      zIndex: 1,
      presentation: WidgetPresentation.FLOATING,
      bindingType: WidgetBindingType.LIVE,
      bindingConfig: {},
      visibility: WidgetVisibility.ACTIVE,
      internalState: {}
    },
    {
      instanceId: 'widget-profile-2',
      ownerId: 'user-1',
      context: 'PROFILE',
      transformState: { x: 200, y: 150, scale: 1, rotation: 0 },
      zIndex: 2,
      presentation: WidgetPresentation.FLOATING,
      bindingType: WidgetBindingType.LIVE,
      bindingConfig: {},
      visibility: WidgetVisibility.ACTIVE,
      internalState: {}
    }
  ];
}
