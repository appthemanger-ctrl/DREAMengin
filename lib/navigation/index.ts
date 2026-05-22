// Index file for navigation module
export { AnchorStateBuffer, HOLD_FIRED, HOLD_HOLDING, HOLD_IDLE, MODE_HOME, MODE_PROFILE, MODE_SHRUNK } from './AnchorStateBuffer';
export { AnchorWidgetStorage } from './AnchorWidgetStorage';
export { GestureFrameComputer } from './GestureFrameComputer';
export { GestureIntent, GestureIntentResolver, HOLD_THRESHOLD_MS, PINCH_IN_THRESHOLD, PINCH_OUT_THRESHOLD, SWIPE_THRESHOLD } from './GestureIntentResolver';
export { FULLSCREEN_DEPTH, LAYER_CUBE, LAYER_DREAM, LAYER_HOME, LAYER_PROFILE, LAYER_WIDGET, NavStateBuffer, PROFILE_DEPTH } from './NavStateBuffer';
export { PointerEventCapture } from './PointerEventCapture';
export { ReturnStack } from './ReturnStack';
export { SpatialNavigationEngine } from './SpatialNavigationEngine';
export { TransformSolver } from './TransformSolver';
export { useNavigation } from './useNavigation';
export { WidgetBindingType, WidgetInstanceMemory, WidgetPresentation, WidgetVisibility } from './WidgetInstanceMemory';

export type { AnchorWidgetState, HomeSlotMapping, PriorityWidget } from './AnchorWidgetStorage';
export type { GestureFrame } from './GestureFrameComputer';
export type { ResolvedIntent } from './GestureIntentResolver';
export type { PointerState } from './PointerEventCapture';
export type { EngineConfig, EngineEventCallback, EngineEventType } from './SpatialNavigationEngine';
export type { TransformOutput, ViewportMetrics } from './TransformSolver';
export type { NavigationState, UseNavigationOptions } from './useNavigation';
export type { WidgetInstanceRecord, WidgetTransformState } from './WidgetInstanceMemory';

// StructureLedger — precomputed conserved navigation structure
export { ledgerStats, matchState, resolveTransition } from './StructureLedger';

// Quaternion Math (Section 3)
export * from './quaternion';

// Manifold Smoothing (Section 4)
export * from './manifold';

// Physics Model (Section 5)
export * from './physics';

// Home Anchor Field (Section 8)
export * from './anchorField';
