# DualSense Integration Example

This example shows how to add haptic feedback to the Racing Game using the new DualSense support.

## Before (No Haptics)

```tsx
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useKeySet, useSubmitScore } from '@/lib/games/hooks';

export default function RacingGame() {
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const keysRef = useKeySet(phase === 'playing');

  // Game loop
  useEffect(() => {
    // ... game logic

    // Collision with wall
    if (!onTrack(car.x, car.y)) {
      car.speed *= 0.5; // Slow down, but no feedback!
    }

    // Acceleration
    if (keysRef.current.has('ArrowUp')) {
      car.speed = Math.min(5, car.speed + 0.1);
    }
  }, [phase]);

  // ... rest of game
}
```

## After (With Haptics)

```tsx
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useKeySet, useSubmitScore } from '@/lib/games/hooks';
import { useGamepad } from '@/lib/games/useGamepad'; // ← Import DualSense hook

export default function RacingGame() {
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const keysRef = useKeySet(phase === 'playing');
  const { rumble, isDualSense } = useGamepad(); // ← Get rumble function

  // Track previous collision state to avoid repeated rumble
  const wasOffTrackRef = useRef(false);

  // Game loop
  useEffect(() => {
    // ... game logic

    // Collision with wall
    const offTrack = !onTrack(car.x, car.y);
    if (offTrack && !wasOffTrackRef.current) {
      car.speed *= 0.5;

      // ← Haptic feedback for wall collision
      if (isDualSense) {
        rumble(0.7, 120); // Strong pulse, 120ms
      }
    }
    wasOffTrackRef.current = offTrack;

    // Acceleration
    if (keysRef.current.has('ArrowUp')) {
      car.speed = Math.min(5, car.speed + 0.1);

      // ← Subtle rumble while accelerating
      if (isDualSense && car.speed > 3) {
        rumble(0.15, 30); // Very light pulse
      }
    }

    // Lap completed
    if (car.lap > previousLap) {
      // ← Victory rumble pattern
      if (isDualSense) {
        rumble(0.5, 100);
        setTimeout(() => rumble(0.5, 100), 150);
      }
    }
  }, [phase, rumble, isDualSense]);

  // ... rest of game
}
```

## Key Changes

1. **Import the hook**: `import { useGamepad } from '@/lib/games/useGamepad';`
2. **Get rumble function**: `const { rumble, isDualSense } = useGamepad();`
3. **Add haptic feedback**:
   - Check `isDualSense` to avoid calling rumble on non-DualSense controllers
   - Call `rumble(intensity, duration)` at key moments
   - Use appropriate intensity (0-1) and duration (ms)

## Haptic Feedback Best Practices

### 1. Match Feedback to Event Severity

```tsx
// Light touch
rumble(0.2, 30);   // UI button press, menu selection

// Medium impact
rumble(0.5, 80);   // Jump, dash, small collision

// Heavy impact
rumble(0.8, 150);  // Wall crash, explosion, damage

// Victory/special
rumble(0.6, 100);  // Lap complete, power-up collected
setTimeout(() => rumble(0.6, 100), 120); // Double pulse
```

### 2. Avoid Rumble Spam

```tsx
// ❌ BAD: Rumbles every frame
useEffect(() => {
  if (accelerating) {
    rumble(0.3, 50); // Called 60 times per second!
  }
}, [accelerating]);

// ✅ GOOD: Debounce or use state to track
const lastRumbleRef = useRef(0);
useEffect(() => {
  if (accelerating && Date.now() - lastRumbleRef.current > 200) {
    rumble(0.3, 50);
    lastRumbleRef.current = Date.now();
  }
}, [accelerating]);
```

### 3. Use Edge Detection

```tsx
// ❌ BAD: Rumbles while off-track
if (offTrack) {
  rumble(0.7, 120); // Repeats every frame!
}

// ✅ GOOD: Rumble only on collision moment
const wasOffTrackRef = useRef(false);
if (offTrack && !wasOffTrackRef.current) {
  rumble(0.7, 120); // Once per collision
}
wasOffTrackRef.current = offTrack;
```

### 4. Consider Mobile Battery

```tsx
// Detect mobile platform
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Reduce intensity on mobile to save battery
const intensity = isMobile ? 0.4 : 0.7;
rumble(intensity, 100);
```

## Complete Integration Examples

### Space Shooter (Shoot Feedback)

```tsx
import { useGamepad } from '@/lib/games/useGamepad';

export default function SpaceShooter() {
  const { rumble, isDualSense } = useGamepad();

  const shoot = useCallback(() => {
    // Create bullet
    bullets.push(new Bullet(player.x, player.y));

    // Haptic feedback
    if (isDualSense) {
      rumble(0.3, 40); // Quick pulse for shot
    }
  }, [rumble, isDualSense]);

  const handleHit = useCallback(() => {
    // Enemy hit
    score += 100;

    // Haptic feedback
    if (isDualSense) {
      rumble(0.5, 80); // Medium pulse for hit
    }
  }, [rumble, isDualSense]);

  const handlePlayerDamage = useCallback(() => {
    // Player takes damage
    health -= 10;

    // Haptic feedback
    if (isDualSense) {
      rumble(0.9, 200); // Strong, long pulse for damage
    }
  }, [rumble, isDualSense]);
}
```

### Platformer (Jump & Land Feedback)

```tsx
import { useGamepad } from '@/lib/games/useGamepad';

export default function Platformer() {
  const { rumble, isDualSense } = useGamepad();

  useEffect(() => {
    const handleGameInput = (e: Event) => {
      const { action, active } = (e as CustomEvent).detail;

      // Jump feedback
      if (action === 'jump' && active && player.grounded) {
        if (isDualSense) {
          rumble(0.4, 60); // Light pulse on jump
        }
      }
    };

    window.addEventListener('de-game-input', handleGameInput);
    return () => window.removeEventListener('de-game-input', handleGameInput);
  }, [rumble, isDualSense]);

  // Landing feedback
  useEffect(() => {
    if (player.grounded && player.prevVelocityY > 5) {
      // Hard landing
      if (isDualSense) {
        const intensity = Math.min(0.9, player.prevVelocityY / 10);
        rumble(intensity, 100); // Intensity based on fall speed
      }
    }
  }, [player.grounded, rumble, isDualSense]);
}
```

### Racing Game (Engine Rumble Pattern)

```tsx
import { useGamepad } from '@/lib/games/useGamepad';

export default function RacingGame() {
  const { rumble, isDualSense } = useGamepad();

  // Continuous engine rumble based on speed
  useEffect(() => {
    if (phase !== 'playing' || !isDualSense) return;

    const interval = setInterval(() => {
      const speed = playerRef.current.speed;

      if (speed > 0.5) {
        // Rumble intensity and frequency based on speed
        const intensity = 0.15 + (speed / 10) * 0.25; // 0.15 - 0.4
        const duration = Math.max(30, 100 - speed * 10); // 30-100ms

        rumble(intensity, duration);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, rumble, isDualSense]);
}
```

## Global Rumble Function

For games that don't use React hooks, use the global function:

```javascript
// In vanilla JS or non-React context
if (window.gamepadRumble) {
  window.gamepadRumble(0.5, 100);
}

// Check if DualSense is connected
const isDualSenseConnected = () => {
  const gamepads = navigator.getGamepads();
  return Array.from(gamepads).some(gp =>
    gp && gp.id.toLowerCase().includes('dualsense')
  );
};
```

## Testing Your Haptics

Use the browser console to test different patterns:

```javascript
// Test different intensities
window.gamepadRumble(0.2, 100); // Light
window.gamepadRumble(0.5, 100); // Medium
window.gamepadRumble(0.8, 100); // Strong

// Test different durations
window.gamepadRumble(0.5, 50);  // Short
window.gamepadRumble(0.5, 150); // Medium
window.gamepadRumble(0.5, 300); // Long

// Test patterns
window.gamepadRumble(0.5, 80);
setTimeout(() => window.gamepadRumble(0.5, 80), 150);
setTimeout(() => window.gamepadRumble(0.5, 80), 300);
```

## Mobile Gyro Controls (Advanced)

For mobile games, you can also use gyro data:

```tsx
import { useDualSense } from '@/lib/games/DualSenseManager';

export default function RacingGame() {
  const { state, rumble, isMobile } = useDualSense({
    enableGyro: true,
    enableHaptics: true,
  });

  useEffect(() => {
    if (!isMobile || !state.connected) return;

    // Use gyro for steering (phone tilt)
    car.angle += state.gyro.x * 0.02;

    // Combine with analog stick
    car.angle += state.leftStick.x * 0.05;
  }, [state, isMobile]);
}
```

## Fallback for Non-DualSense Controllers

Always check `isDualSense` before using advanced features:

```tsx
const { rumble, isDualSense } = useGamepad();

// Haptic feedback (DualSense only)
if (isDualSense) {
  rumble(0.5, 100);
}

// Generic controllers will still get standard input via de-game-input events
// No additional code needed!
```

## Summary

1. Import `useGamepad` hook
2. Extract `rumble` and `isDualSense`
3. Add haptic feedback at key moments
4. Check `isDualSense` to avoid errors
5. Use appropriate intensity (0-1) and duration (ms)
6. Test in browser console before integrating

Happy rumbling! 🎮✨
