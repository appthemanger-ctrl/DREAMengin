// Index file for navigation module
export { NavStateBuffer, LAYER_HOME, LAYER_CUBE, LAYER_PROFILE, LAYER_WIDGET, LAYER_DREAM, PROFILE_DEPTH, FULLSCREEN_DEPTH } from './NavStateBuffer';
export { ReturnStack } from './ReturnStack';
export { PointerEventCapture } from './PointerEventCapture';
export { GestureFrameComputer } from './GestureFrameComputer';
export { GestureIntentResolver, GestureIntent, PINCH_IN_THRESHOLD, PINCH_OUT_THRESHOLD, SWIPE_THRESHOLD, HOLD_THRESHOLD_MS } from './GestureIntentResolver';
export { TransformSolver } from './TransformSolver';
export { WidgetInstanceMemory, WidgetPresentation, WidgetVisibility, WidgetBindingType } from './WidgetInstanceMemory';
export { SpatialNavigationEngine } from './SpatialNavigationEngine';
export { useNavigation } from './useNavigation';

export type { PointerState } from './PointerEventCapture';
export type { GestureFrame } from './GestureFrameComputer';
export type { ResolvedIntent } from './GestureIntentResolver';
export type { TransformOutput, ViewportMetrics } from './TransformSolver';
export type { WidgetTransformState, WidgetInstanceRecord } from './WidgetInstanceMemory';
export type { EngineConfig, EngineEventType, EngineEventCallback } from './SpatialNavigationEngine';
export type { UseNavigationOptions, NavigationState } from './useNavigation';
