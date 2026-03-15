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
export { AnchorStateBuffer, MODE_HOME, MODE_PROFILE, MODE_SHRUNK, HOLD_IDLE, HOLD_HOLDING, HOLD_FIRED } from './AnchorStateBuffer';
export { AnchorWidgetStorage } from './AnchorWidgetStorage';

export type { PointerState } from './PointerEventCapture';
export type { GestureFrame } from './GestureFrameComputer';
export type { ResolvedIntent } from './GestureIntentResolver';
export type { TransformOutput, ViewportMetrics } from './TransformSolver';
export type { WidgetTransformState, WidgetInstanceRecord } from './WidgetInstanceMemory';
export type { EngineConfig, EngineEventType, EngineEventCallback } from './SpatialNavigationEngine';
export type { UseNavigationOptions, NavigationState } from './useNavigation';
export type { HomeSlotMapping, PriorityWidget, AnchorWidgetState } from './AnchorWidgetStorage';

// StructureLedger — precomputed conserved navigation structure
export { matchState, resolveTransition, ledgerStats } from './StructureLedger';

// Quaternion Math (Section 3)
export * from './quaternion';

// Manifold Smoothing (Section 4)
export * from './manifold';

// Physics Model (Section 5)
export * from './physics';

// Home Anchor Field (Section 8)
export * from './anchorField';
