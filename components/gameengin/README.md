# GameEngin Component

WebGPU-powered game engine with DualSense controller support for the DREAMengin platform.

## Overview

The GameEngin component provides a high-performance game engine built on:
- **WebGPU** with automatic fallback to WebGL
- **Babylon.js 8.x** for 3D rendering
- **DualSense Controller Support** (PS5) via Bluetooth on mobile and USB on desktop
- **TensorFlow.js** for learning/telemetry
- **Snapshot Rendering** for optimal performance

## Features

### 🎮 DualSense Controller Support
- **Bluetooth pairing** on phone (Android 12+ / iOS 14.5+)
- **Gyroscope steering** for natural mobile gameplay
- **Haptic rumble feedback** (Android Chrome)
- **All standard buttons** (Cross, Circle, Square, Triangle, L1, R1, L2, R2, D-pad)
- **Analog sticks** for precise control

### 🚀 High-Performance Rendering
- **WebGPU-first** with automatic WebGL fallback
- **Snapshot rendering** (FAST mode) for massive FPS gains
- **High-performance adapter** for best GPU utilization
- **Responsive resizing** that respects DreamDM Bar drag

### 🎯 Demo Games

#### Neon Drift (Cyberpunk Racer)
- **Controls:**
  - R2 Trigger: Accelerate
  - Left Stick / Gyro: Steer
  - High-speed rumble feedback
- **Features:** Endless runner, neon visuals, speed-based difficulty

#### Echo Arena (Top-Down Shooter)
- **Controls:**
  - Left Stick: Move
  - Right Stick / Gyro: Aim
  - R2 Trigger: Shoot (with rumble)
- **Features:** Arena combat, gyro aiming, cooldown mechanics

## Installation

Dependencies are already added to `package.json`:
```json
{
  "@babylonjs/core": "^8.54.3",
  "@tensorflow/tfjs": "^4.22.0",
  "@tensorflow/tfjs-backend-webgpu": "^4.22.0"
}
```

Run:
```bash
corepack pnpm install
```

## Usage

### Basic Example

```tsx
import GameEngin from '@/components/gameengin/GameEngin';

export default function MyGamePage() {
  return (
    <GameEngin
      projectId="neon-drift"
      dreamWindowId="my-window-id"
      onReady={() => console.log('Game ready!')}
      onError={(error) => console.error('Game error:', error)}
    />
  );
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `projectId` | `'neon-drift' \| 'echo-arena'` | Which demo game to load |
| `dreamWindowId` | `string` | Unique identifier for this game instance |
| `onReady` | `() => void` | Optional callback when engine is initialized |
| `onError` | `(error: string) => void` | Optional error callback |

## DualSense Pairing Instructions

### Mobile (Bluetooth)
1. Hold **PS button + Create button** until light bar flashes blue
2. Open phone **Bluetooth settings**
3. Select "Wireless Controller" or "DualSense"
4. Open game in Chrome (Android) or Safari (iOS)
5. Controller auto-connects when game launches

### Desktop (USB)
1. Connect controller via USB-C cable
2. Controller is detected automatically
3. Full feature support including advanced haptics

## Architecture Integration

### Compatible With:
- ✅ **DualRuntimeContainer** - Runs in either Side A or Side B
- ✅ **DreamDM Bar** - Responds to drag/resize events
- ✅ **Spatial Multitasking** - Keeps rendering while switching surfaces
- ✅ **Existing GameRemote** - Can coexist with touch controls
- ✅ **Supabase Telemetry** - Optionally records play data

### Performance Philosophy
Follows ARCHITECTURE.md §10:
- **Render-on-demand** for WebGPU efficiency
- **Hardware scaling** adapts to device capabilities
- **Snapshot rendering** isolates game performance from app UI

## Component Structure

```
components/gameengin/
├── GameEngin.tsx              # Main component
├── GameEnginDemo.tsx          # Demo wrapper with game selector
└── input/
    └── DualSenseManager.ts    # Controller interface
```

## Demo Page

Access the demo at `/gameengin-demo`:
- Toggle between Neon Drift and Echo Arena
- On-screen controls guide
- Real-time status display
- Test DualSense pairing

## Development

### Building
```bash
corepack pnpm run build
```

### Linting
```bash
corepack pnpm run lint
```

### Type Checking
```bash
corepack pnpm run typecheck
```

## Extending

### Adding New Games

1. Create game load function:
```typescript
async function loadMyGame(
  scene: BABYLON.Scene,
  dual: DualSenseManager,
  learning: LearningEngine
) {
  // Create meshes, materials, physics
  const player = BABYLON.MeshBuilder.CreateBox('player', {}, scene);

  // Game loop
  scene.onBeforeRenderObservable.add(() => {
    const input = dual.getState();
    // Update game state based on input
    learning.record({ /* telemetry */ });
  });
}
```

2. Add to GameEngin.tsx:
```typescript
interface GameEnginProps {
  projectId: 'neon-drift' | 'echo-arena' | 'my-game';
  // ...
}

// In init():
if (projectId === 'my-game') {
  await loadMyGame(scene, dualSense, learning);
}
```

### Custom Controller Handling

```typescript
const dualSense = new DualSenseManager(scene, engine, (status) => {
  console.log('Controller status:', status);
});

// In game loop:
const input = dualSense.getState();
if (input.buttons.cross) {
  // Jump
}
if (input.triggers.r2 > 0.5) {
  // Shoot
  dualSense.rumble(0.7, 100);
}
```

## Troubleshooting

### WebGPU Not Available
- **Check**: Chrome 113+ or Edge 113+ with WebGPU enabled
- **Solution**: Component auto-falls back to WebGL

### Controller Not Connecting
- **Mobile**: Ensure Bluetooth is enabled and controller is in pairing mode
- **Desktop**: Try different USB port or cable
- **Browser**: Use Chrome/Edge, Safari support is limited

### Performance Issues
- **Lower device pixel ratio**: Engine automatically adapts
- **Disable snapshot rendering**: Remove `snapshotRendering = true` line
- **Reduce scene complexity**: Fewer meshes, simpler materials

## Future Enhancements

Planned features:
- [ ] Multiplayer via WebRTC
- [ ] VR headset support
- [ ] Advanced haptics (DualSense triggers)
- [ ] Save/load game states to Supabase
- [ ] AI opponent using TensorFlow.js models
- [ ] Performance profiling dashboard

## License

Part of the DREAMengin platform. See main repository LICENSE.

## References

- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API)
- [DREAMengin Architecture](../../docs/ARCHITECTURE.md)
