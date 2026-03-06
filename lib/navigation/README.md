# Spatial Navigation Math Library

Low-level math and subsystem primitives for DREAMengin's navigation layer.

> **Active navigation:** The app navigates via the **τ-transition system** implemented in
> `lib/dreamnav/` (`DreamNavSurface6`, `delta.ts`, `tau()`). Spatial swipe gestures are
> **disabled** per spec §3.4; space changes happen through the Daydreams menu.
> This module provides the math foundation (quaternions, manifold projections, physics)
> used internally by that system.

## Mathematical Foundation (v1.0.4+)

The navigation math implements a **Spatial UI OS / Navigation Manifold Engine** underpinning the τ-transition model.

### Topology: 3-Torus × Sphere Hybrid

The navigation space is NOT a simple cube—it's a cube projected onto a smooth manifold:

```
Primary Space: T = S¹ × S¹ × S¹ (3-Torus)
Sphere Component: S = S²

Effective Space: Ω = (S² × S¹) / ~equivalence
```

**Properties:**
- Feels spherical with continuous curvature
- Wraps infinitely (toroidal behavior)
- Has cube adjacency for discrete navigation
- No visible edges or seams

### Core Mathematical Components

#### 1. Quaternion Rotation Engine (Section 3)

All rotations use quaternions. **NO Euler angles.**

```typescript
q = (w, xi, yj, zk)  where ||q|| = 1
```

**Key Features:**
- Gesture-to-quaternion conversion: `q = [cos(θ/2), a * sin(θ/2)]`
- Quaternion composition: `orientation_next = q ⊗ orientation_current`
- Drift correction: Normalize every N frames to prevent accumulation error
- No gimbal lock

**Implementation:** `lib/navigation/quaternion.ts`

#### 2. Manifold Smoothing (Section 4)

Creates seamless "round cube" transition:

```typescript
// Cubic → Spherical projection
s = c / ||c||                    // Normalize to sphere
p = lerp(c, s, λ)               // Interpolate
```

**Dynamic λ based on zoom:**
- λ → 1 when zoomed out (more spherical)
- λ → 0 when zoomed in (more cubic)

**Edge Blending:**
```typescript
weight = smoothstep(0, ε, distToEdge)
position = mix(faceA, faceB, weight)
```

**Implementation:** `lib/navigation/manifold.ts`

#### 3. Gesture Physics Model (Section 5)

Navigation behaves like a damped spring system:

```
θ'' + 2ζωθ' + ω²θ = F(t)
```

Where:
- θ = rotation angle
- ζ = damping coefficient (critical: ζ = 1, no overshoot)
- ω = natural frequency
- F = gesture impulse force

**Inertia with exponential decay:**
```
v(t) = v0 * e^(-βt)
```

**Snap Stabilization:**
- If |θ| < 0.02 rad → snap to grid
- Prevents micro-jitter

**Implementation:** `lib/navigation/physics.ts`

#### 4. Home Anchor Field (Section 8)

Anchor emits an attractor field that naturally pulls navigation toward home:

```
U(p) = k / ||p - p_home||        // Potential function
F = -∇U                          // Force gradient
```

**Recenter Algorithm:**
- If idle > 3000ms → apply force field
- User drifts home naturally without explicit action

**Implementation:** `lib/navigation/anchorField.ts`

#### 5. Coordinate Systems (Section 2)

**Spherical Parameterization:**
```typescript
θ ∈ [0, π]    // Polar angle
φ ∈ [0, 2π]   // Azimuthal angle

x = sin(θ) cos(φ)
y = sin(θ) sin(φ)
z = cos(θ)
```

**Slot Position (Polar Layout):**
```typescript
slotPosition = r * (cos(α), sin(α), 0)
where α = i * (2π / 8)  for slot i ∈ {0..7}
```

#### 6. Widget Mount Geometry (Section 11)

Each widget rendered on a curved quad for lens effect:

```
z = κ(x² + y²)
```

where κ = curvature constant

## Overview

This module provides low-level subsystems consumed by the τ-transition navigation engine defined in `lib/dreamnav/`. It provides:

- **Zero-allocation state buffers** - Int32Array buffers, no GC pressure
- **60fps performance target** - GPU-accelerated transforms
- **Touch-first pointer tracking** - Pointer events with mobile Safari optimization
- **τ-transition routing** - Navigation via DreamNavSurface6 + tau(), not continuous gesture axis
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

### Unit Tests

The navigation system includes comprehensive test coverage:

```bash
# Run navigation tests
npm test tests/navigation/

# Run specific test suites
npm test tests/navigation/quaternion.spec.ts
npm test tests/navigation/manifold-physics.spec.ts
npm test tests/navigation/navigation.spec.ts
```

### Test Coverage

**Quaternion Math (Section 3):**
- ✓ Identity quaternion initialization
- ✓ Axis-angle conversion
- ✓ Quaternion multiplication
- ✓ Normalization and drift correction
- ✓ Gesture-to-quaternion conversion
- ✓ SLERP interpolation

**Manifold Smoothing (Section 4):**
- ✓ Cubic-to-spherical projection
- ✓ Dynamic lambda computation
- ✓ Spherical coordinate conversion
- ✓ Edge blending (smoothstep)
- ✓ Slot position (polar layout)
- ✓ Widget curvature (lens effect)

**Physics Model (Section 5):**
- ✓ Critical damping (ζ=1)
- ✓ Inertial decay (exponential)
- ✓ Snap stabilization (δ=0.02 rad)
- ✓ Physics state integration

**Anchor Field (Section 8):**
- ✓ Potential function computation
- ✓ Force field gradient
- ✓ Recenter activation after idle

**Navigation State:**
- ✓ Buffer initialization
- ✓ Depth increment/decrement
- ✓ Face rotation with modular arithmetic

### Testing Metrics (Section 17)

Target metrics for production quality:

| Metric              | Target   | Status |
|---------------------|----------|--------|
| Rotation jitter     | <0.5px   | ⏳     |
| Snap latency        | <12ms    | ⏳     |
| Warp distortion     | <2%      | ⏳     |
| Drift error         | <1e-6    | ⏳     |
| Gesture loss        | 0%       | ⏳     |

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
