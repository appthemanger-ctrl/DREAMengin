# DualSense Controller Integration

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


DREAMengin now includes comprehensive DualSense (PS5) controller support with mobile Bluetooth pairing, haptic feedback, and gyro controls.

## Features (March 2026 Browser Capabilities)

### ✅ Fully Supported
- **Standard Gamepad Input**: Buttons, sticks, triggers, D-pad (all platforms)
- **Bluetooth Pairing**: Android 12+ (Chrome), iOS 14.5+ (Safari)
- **Haptic Feedback/Rumble**: Android Chrome, desktop browsers
- **Auto-Detection**: Automatically detects DualSense via vendor ID (054c) or name

### ⚠️ Limited Support
- **Gyroscope/Accelerometer**: Available on mobile for tilt steering/aiming
- **Adaptive Triggers**: Desktop-only via WebHID (not available in mobile browsers)
- **LED Light Bar**: Limited browser support (use in-game visual feedback instead)
- **Touchpad**: Limited browser support

## Pairing Instructions

### Mobile (Android/iOS)
1. Hold **PS button** + **Create button** until the light bar flashes blue
2. Open Bluetooth settings on your phone/tablet
3. Select "Wireless Controller" or "DualSense" from available devices
4. Open DREAMengin in Chrome (Android) or Safari (iOS)
5. Controller will auto-connect when you press any button

### Desktop
- USB: Plug and play
- Bluetooth: Pair via system Bluetooth settings

## Usage for Game Developers

### React Hook (Recommended)

```tsx
import { useGamepad } from '@/lib/games/useGamepad';

function MyGame() {
  const { connected, gamepadName, isDualSense, rumble } = useGamepad();

  // Trigger haptic feedback
  const handleCollision = () => {
    if (isDualSense) {
      rumble(0.8, 150); // 80% intensity, 150ms duration
    }
  };

  return (
    <div>
      {connected && (
        <div>
          {isDualSense ? '🎮 DualSense' : '🕹 Controller'} Connected
        </div>
      )}
    </div>
  );
}
```

### Class-Based API (Non-React)

```typescript
import { DualSenseManager } from '@/lib/games/DualSenseManager';

const manager = new DualSenseManager({
  enableGyro: true,      // Enable gyroscope input (mobile)
  enableHaptics: true,   // Enable haptic feedback
  deadZone: 0.15,        // Analog stick dead zone (0-1)
  debug: false,          // Enable debug logging
});

await manager.init();

// Read controller state
const state = manager.getState();
console.log(state.leftStick);   // { x: number, y: number }
console.log(state.rightStick);  // { x: number, y: number }
console.log(state.triggers);    // { l2: number, r2: number }
console.log(state.gyro);        // { x: number, y: number, z: number }
console.log(state.buttons);     // All button states

// Trigger haptic feedback
manager.rumble(0.6, 100); // 60% intensity, 100ms

// Visual feedback (emits custom event for in-game UI)
manager.showFeedback('neon', 'pulse');

// Cleanup
manager.destroy();
```

### Global Rumble Function

GameEngin automatically exposes a global rumble function:

```javascript
// In any game component
if (window.gamepadRumble) {
  window.gamepadRumble(0.5, 80); // 50% intensity, 80ms
}
```

## Integration with Existing Games

All games that listen to the `de-game-input` CustomEvent protocol automatically get DualSense support. No changes required for basic input!

### Example: Adding Haptic Feedback

```tsx
// In your game component
import { useGamepad } from '@/lib/games/useGamepad';

function RacingGame() {
  const { rumble } = useGamepad();

  useEffect(() => {
    const handleGameInput = (e: Event) => {
      const { action, active } = (e as CustomEvent).detail;

      // Add haptic feedback for boost
      if (action === 'jump-shoot' && active) {
        rumble(0.5, 50); // Boost feedback
      }
    };

    window.addEventListener('de-game-input', handleGameInput);
    return () => window.removeEventListener('de-game-input', handleGameInput);
  }, [rumble]);

  // ... rest of game
}
```

## Haptic Feedback Patterns

### Recommended Intensity Levels
- **0.1-0.3**: Subtle feedback (UI selection, menu navigation)
- **0.4-0.6**: Medium feedback (shooting, jumping, acceleration)
- **0.7-0.9**: Strong feedback (collisions, explosions, impacts)
- **1.0**: Maximum intensity (major events, game over)

### Recommended Durations
- **20-50ms**: Quick pulse (button press, bullet fire)
- **80-150ms**: Medium pulse (jump, dash, collision)
- **200-400ms**: Long pulse (explosion, power-up, damage)

### Example Patterns

```typescript
// Button press confirmation
rumble(0.2, 30);

// Jump
rumble(0.4, 80);

// Collision
rumble(0.8, 150);

// Explosion
rumble(1.0, 300);

// Engine rumble (continuous)
setInterval(() => rumble(0.3, 50), 100);
```

## Architecture

### Event Flow
1. DualSense connects via Bluetooth or USB
2. `useGamepad` hook detects connection and starts polling
3. Button/stick input → `de-game-input` CustomEvents
4. Games listen for these events (existing protocol)
5. Games can trigger haptic feedback via `rumble()` function

### Files
- `lib/games/useGamepad.ts` - React hook with DualSense detection and haptics
- `lib/games/DualSenseManager.ts` - Class-based manager with full state access
- `components/daydream/GameEngin.tsx` - Exposes rumble globally, shows connection status

## Browser Compatibility

| Feature | Android Chrome | iOS Safari | Desktop Chrome | Desktop Safari |
|---------|----------------|------------|----------------|----------------|
| Bluetooth Pairing | ✅ Android 12+ | ✅ iOS 14.5+ | ✅ | ✅ |
| Basic Input | ✅ | ✅ | ✅ | ✅ |
| Haptic Feedback | ✅ | ⚠️ Limited | ✅ | ✅ |
| Gyroscope | ✅ | ✅ | ❌ | ❌ |
| Adaptive Triggers | ❌ | ❌ | ⚠️ WebHID only | ❌ |

## Testing

### Test on Real Device
1. Pair DualSense to your Android phone or iPhone
2. Visit `https://gamepad-tester.com` to verify inputs register
3. Open DREAMengin → Games Daydream → Launch any game
4. Verify controller input works and rumble triggers

### Test on Desktop
1. Connect DualSense via USB or Bluetooth
2. Open DREAMengin in Chrome/Edge
3. GameEngin should show "🎮 DualSense" badge
4. Test in any game with haptic feedback

## Mobile Optimization

### Gyro Steering Example
```typescript
const state = manager.getState();

// Use gyro for steering (mobile tilt)
car.rotation.y += state.gyro.x * 1.2;

// Combine with analog stick for hybrid control
car.rotation.y += state.leftStick.x * 0.8;
```

### Battery Considerations
- Haptic feedback drains battery faster on mobile
- Consider reducing rumble intensity on mobile: `rumble(0.3, 50)` instead of `rumble(0.8, 150)`
- Allow users to toggle haptics in game settings

## Troubleshooting

### Controller Not Detected
- Ensure Bluetooth is enabled
- Try re-pairing (forget device and pair again)
- Press any button after pairing to wake the controller

### Haptics Not Working
- Haptics require HTTPS (not localhost HTTP)
- iOS Safari has limited haptic support
- Check browser console for errors

### Input Lag
- Use USB connection on desktop for lowest latency
- Bluetooth has ~10-15ms additional latency
- Polling runs at 60fps via requestAnimationFrame

## Future Enhancements

Planned features for future browser API updates:
- Full adaptive trigger support (when WebHID becomes available on mobile)
- LED light bar control (currently desktop-only via WebHID)
- Touchpad input mapping
- Speaker/microphone support
- Multi-controller support for local multiplayer

## References

- [Gamepad API Spec](https://w3c.github.io/gamepad/)
- [DualSense Technical Specs](https://www.playstation.com/en-us/accessories/dualsense-wireless-controller/)
- [Browser Compatibility](https://caniuse.com/gamepad)
