# Gesture-Driven Spatial Navigation Engine

Mobile-first navigation system for DREAMengin that uses gestures (pinch, swipe, hold) instead of traditional nav bars and routes.

## Overview

The spatial navigation engine implements a low-level, mobile-optimized navigation system based on the technical spec defined in `@dreamengin_interface.md`. It provides:

- **Zero-allocation gesture detection** - Int32Array buffers, no GC pressure
- **60fps performance target** - GPU-accelerated transforms
- **Touch-first interaction** - Pointer events with mobile Safari optimization
- **No traditional routing** - Navigation is a continuous spatial axis (zoom/rotate)
- **Guaranteed return path** - ReturnStack ensures users can always go back

## Architecture

### Core Runtime Objects

```
NavStateBuffer (Int32Array[4])
├── [0] layer   (0=HOME, 1=CUBE, 2=PROFILE, 3=WIDGET, 4=DREAM)
├── [1] face    (0-5 for cube rotation)
├── [2] slot    (-1=null, 0-7 for widget slots)
└── [3] depth   (>=0, zoom level)

ReturnStack
└── Fixed-size ring buffer of NavState snapshots

PointerEventCapture
├── Document-level pointer events
├── Max 2 active pointers (pinch support)
└── setPointerCapture for smooth tracking

GestureFrameComputer
├── Centroid calculation
├── Delta computation (dx, dy, dt)
└── Pinch distance detection

GestureIntentResolver
├── ZOOM_IN / ZOOM_OUT (pinch threshold ±12px)
├── ROTATE_X / ROTATE_Y (swipe threshold 8px)
└── HOLD (420ms threshold)

TransformSolver
└── GPU-accelerated transform generation

WidgetInstanceMemory
├── Pre-allocated widget instances (never destroyed)
├── O(1) context switching (HOME ↔ PROFILE)
└── Z-index sorted rendering
```

### Runtime Execution Order (Fixed)

```
1. Pointer event capture
2. Gesture frame construction
3. Gesture intent resolution
4. Navigation state mutation
5. Transform solving
6. Single DOM write batch
7. Compositor handoff (GPU)
```

## Usage

### Basic Integration

```tsx
import { useNavigation } from '@/lib/navigation';

function MyComponent() {
  const { navState, isReady, goHome, switchToProfile } = useNavigation({
    enablePersistence: true,
    widgets: myWidgetInstances,
  });
  
  return (
    <div>
      <div>Layer: {navState.layer}, Depth: {navState.depth}</div>
      <button onClick={goHome}>Home</button>
      <button onClick={switchToProfile}>Profile</button>
    </div>
  );
}
```

### Advanced Engine Usage

```tsx
import { SpatialNavigationEngine } from '@/lib/navigation';

const engine = new SpatialNavigationEngine({
  element: document,
  enablePersistence: true,
});

// Listen to navigation changes
engine.on('navchange', (data) => {
  console.log('Navigation changed:', data.state);
});

// Start the engine
engine.start();

// Apply transforms
engine.applyTransform(containerElement, {
  width: window.innerWidth,
  height: window.innerHeight,
});
```

## Gesture Controls

| Gesture | Action | Effect |
|---------|--------|--------|
| **Pinch In** | Two fingers move closer | Zoom in (depth++) |
| **Pinch Out** | Two fingers move apart | Zoom out (depth--) or return to previous state |
| **Swipe Left/Right** | Horizontal swipe | Rotate cube face |
| **Swipe Up/Down** | Vertical swipe | Rotate cube face (alternate axis) |
| **Hold** | Press and hold 420ms+ | Context-specific action |
| **Tap Home** | Quick tap home button | Return to HOME layer, depth 0 |

## Widget System Integration

### Widget Instance Record

```tsx
interface WidgetInstanceRecord {
  instanceId: string;
  ownerId: string;
  context: 'HOME' | 'PROFILE' | 'OTHER';
  transformState: { x, y, scale, rotation };
  zIndex: number;
  presentation: 'FLOATING' | 'DOCKED' | 'FULL';
  bindingType: 'STATIC' | 'LIVE' | 'SNAPSHOT';
  visibility: 'ACTIVE' | 'BACKGROUND' | 'PARKED';
  internalState: Record<string, unknown>;
}
```

### Presentation Modes

- **FLOATING**: Normal widget, participates in all navigation
- **DOCKED**: Rendered in parallel layer, receives events, doesn't affect NavState
- **FULL**: Fullscreen when depth >= FULLSCREEN_DEPTH (2)

### Context Switching

```tsx
// O(1) pointer swap, no widget mutation
engine.getWidgetMemory().switchToProfile();
engine.getWidgetMemory().switchToHome();
```

## Profile System

Profile is a layer within the navigation system, not a separate route.

### Activation

```tsx
// Profile is active when:
navState.layer === LAYER_PROFILE && navState.depth === PROFILE_DEPTH
```

### Widget Set Switching

```tsx
// Pre-allocated widget lists
HomeWidgetIndices = [0, 1, 2, ...];
ProfileWidgetIndices = [3, 4, 5, ...];

// O(1) pointer swap on profile entry
ActiveWidgetIndices = ProfileWidgetIndices;
```

## Performance Characteristics

### Targets
- **60fps** on mobile devices
- **0 allocations per frame** (pre-allocated buffers)
- **0 layout reads per frame** (cached metrics)
- **1 DOM write per frame** (batched transforms)
- **GPU-only transforms** (translate3d, will-change)

### Mobile Optimization

```css
/* Applied to transformed elements */
.spatial-element {
  will-change: transform;
  contain: paint layout;
  transform: translate3d(x, y, 0) scale(s);
}
```

## Persistence

Navigation state is persisted using `requestIdleCallback`:

```tsx
// Only persists during idle frames
if (requestIdleCallback) {
  requestIdleCallback(() => {
    localStorage.setItem('nav_state', JSON.stringify({
      navState: Array.from(navStateBuffer.snapshot()),
      returnStackTop: Array.from(returnStack.peek()),
    }));
  });
}
```

## Invariant Enforcement

Every frame, the engine validates:
- `depth >= 0`
- `face in [0..5]`
- `slot == -1 or [0..7]`
- ReturnStack not empty (except at HOME)

On violation: `forceReturn()` restores last valid state.

## API Reference

### NavStateBuffer

```tsx
const buffer = new NavStateBuffer();
buffer.layer; // 0-4
buffer.face;  // 0-5
buffer.slot;  // -1 or 0-7
buffer.depth; // >= 0

buffer.incrementDepth();
buffer.decrementDepth();
buffer.rotateFace(delta);
buffer.snapshot(); // Returns Int32Array copy
buffer.restore(snapshot);
buffer.isValid();
buffer.isProfileActive();
buffer.isFullscreen();
```

### SpatialNavigationEngine

```tsx
const engine = new SpatialNavigationEngine(config);

engine.start();
engine.stop();
engine.getNavState();
engine.getWidgetMemory();
engine.homeAnchorInterrupt();
engine.computeTransform(viewport);
engine.applyTransform(element, viewport);

engine.on('navchange', callback);
engine.on('gesture', callback);
engine.on('error', callback);
engine.off(event, callback);
```

## Demo

Visit `/gesture-nav` to see the navigation engine in action with live gesture controls and state visualization.

## Testing

```bash
# Run navigation tests
npm test tests/navigation/

# Type checking
npm run typecheck
```

## Technical Constraints

- **Mobile Safari (iOS WebKit)** - Primary target
- **Chromium mobile** - Secondary target
- **Single-threaded JS** - No web workers
- **GPU compositor** - Transform-only animations
- **No nav bar** - Pure gesture navigation
- **No routes** - Continuous spatial navigation
- **No remounts** - Widget instances persist

## Future Enhancements

- [ ] Haptic feedback on gesture recognition
- [ ] Custom gesture recording/playback
- [ ] Multi-dimensional cube navigation
- [ ] Advanced widget choreography
- [ ] Gesture analytics tracking
