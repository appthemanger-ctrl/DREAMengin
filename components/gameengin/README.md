# WebGPU Game Components

This directory contains the WebGPU-powered game infrastructure for DREAMengin.

## DualSenseManager

`input/DualSenseManager.ts` - Controller interface for PS5 DualSense support

- **Bluetooth pairing** on mobile (Android 12+, iOS 14.5+)
- **USB support** on desktop
- **Gyroscope steering** for natural mobile gameplay
- **Haptic rumble feedback** (Android Chrome)
- **Full button mapping** (Cross, Circle, Square, Triangle, L1, R1, L2, R2, D-pad)
- **Analog stick support** with proper state management

### Pairing Instructions

**Mobile (Bluetooth):**
1. Hold PS + Create until light flashes blue
2. Open phone Bluetooth settings
3. Select "Wireless Controller"
4. Open game in Chrome (Android) or Safari (iOS)

**Desktop (USB):**
1. Connect via USB-C cable
2. Auto-detected

## Games Using This Infrastructure

### Neon Drift (`components/games/NeonDrift.tsx`)
- Cyberpunk endless racer
- WebGPU rendering with Babylon.js
- DualSense gyro steering
- High-speed rumble feedback
- **Launch**: Boot from GamesHub → Neon Drift card

### Echo Arena (`components/games/EchoArena.tsx`)
- Top-down arena shooter
- WebGPU rendering with Babylon.js
- DualSense gyro aiming
- Shoot rumble feedback
- **Launch**: Boot from GamesHub → Echo Arena card

## Integration

Both games are fully integrated into the DREAMengin platform:
- ✅ Registered in `GamesHub.tsx` GAMES array
- ✅ Discoverable in game library
- ✅ Launchable from game cards
- ✅ Compatible with GameRemote controls
- ✅ Score-trackable via `useSubmitScore`
- ✅ Session-saveable (quick resume)
- ✅ Works inline or fullscreen in GameEngin

## Adding More WebGPU Games

To add a new WebGPU game:

1. Create component in `components/games/YourGame.tsx`
2. Use `useGameAutoStart`, `useGamePhase`, `useSubmitScore` hooks
3. Import DualSenseManager for controller support
4. Register in `GamesHub.tsx` GAMES array
5. Add dynamic import at top of GamesHub

See NeonDrift.tsx and EchoArena.tsx as reference implementations.

## Architecture

Follows ARCHITECTURE.md §1 (Daydream pairs), §10 (WebGPU render-on-demand):
- WebGPU-first with WebGL fallback
- Snapshot rendering for optimal performance
- Compatible with DualRuntimeContainer
- Respects DreamDM Bar drag and spatial multitasking
