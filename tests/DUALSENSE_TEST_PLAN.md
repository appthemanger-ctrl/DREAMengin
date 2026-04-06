# DualSense Integration Testing Checklist

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


## Manual Testing

### Desktop Testing (USB/Bluetooth)

#### Prerequisites
- [ ] DualSense controller available
- [ ] Chrome or Edge browser (latest version)
- [ ] Development server running (`pnpm dev`)

#### Test Cases

##### TC1: Controller Connection (USB)
1. [ ] Connect DualSense via USB cable
2. [ ] Navigate to `/daydream/games`
3. [ ] Verify GameEngin shows "🎮 DualSense" badge (green)
4. [ ] Check browser console for connection message
5. [ ] Verify welcome rumble pulse (light vibration)

**Expected**: Controller detected, badge shows DualSense, welcome rumble triggers

##### TC2: Controller Connection (Bluetooth)
1. [ ] Pair DualSense via system Bluetooth settings
2. [ ] Navigate to `/daydream/games`
3. [ ] Press any button to activate
4. [ ] Verify GameEngin shows "🎮 DualSense" badge (green)
5. [ ] Verify welcome rumble pulse

**Expected**: Same as TC1

##### TC3: Standard Input
1. [ ] With controller connected, open any game
2. [ ] Test all inputs:
   - [ ] Left stick (movement)
   - [ ] Right stick (camera/actions)
   - [ ] Cross button (jump)
   - [ ] Circle button (shoot)
   - [ ] Square button (spin)
   - [ ] Triangle button (duck)
   - [ ] L1/R1 (combos)
   - [ ] L2/R2 triggers
   - [ ] D-pad (directions)
   - [ ] Options button (pause)

**Expected**: All inputs fire `de-game-input` events and game responds

##### TC4: Haptic Feedback
1. [ ] Open a game that triggers rumble (check console: `window.gamepadRumble`)
2. [ ] Perform actions that should trigger rumble
3. [ ] Verify controller vibrates

**Test scenarios**:
```javascript
// In browser console:
window.gamepadRumble(0.3, 100)  // Light pulse
window.gamepadRumble(0.6, 150)  // Medium pulse
window.gamepadRumble(1.0, 300)  // Strong pulse
```

**Expected**: Controller vibrates with appropriate intensity and duration

##### TC5: Controller Disconnect
1. [ ] With controller connected, disconnect USB or turn off Bluetooth
2. [ ] Verify badge changes to "🎮 No Controller" (gray)
3. [ ] Reconnect controller
4. [ ] Verify badge updates to "🎮 DualSense" (green)

**Expected**: UI reflects connection state in real-time

##### TC6: Multiple Reconnections
1. [ ] Connect DualSense
2. [ ] Disconnect
3. [ ] Connect again
4. [ ] Repeat 3 times
5. [ ] Verify no memory leaks (check browser DevTools Memory tab)

**Expected**: Clean reconnection each time, no stale event listeners

---

### Mobile Testing (Bluetooth)

#### Prerequisites (Android)
- [ ] Android 12+ device
- [ ] Chrome browser (latest version)
- [ ] DualSense controller

#### Test Cases

##### TC7: Bluetooth Pairing (Android)
1. [ ] Hold PS button + Create button until light flashes blue
2. [ ] Open Android Bluetooth settings
3. [ ] Select "Wireless Controller"
4. [ ] Open Chrome and navigate to DREAMengin
5. [ ] Navigate to `/daydream/games`
6. [ ] Press any button on controller
7. [ ] Verify "🎮 DualSense" badge appears
8. [ ] Check console for "phone Bluetooth" message

**Expected**: Controller pairs and connects successfully

##### TC8: Mobile Haptic Feedback
1. [ ] With DualSense connected on Android
2. [ ] Test rumble in browser console:
```javascript
window.gamepadRumble(0.5, 100)
```
3. [ ] Verify controller vibrates

**Expected**: Haptic feedback works on Android Chrome

##### TC9: Mobile Input
1. [ ] Test all standard inputs (see TC3)
2. [ ] Verify game responds to controller input
3. [ ] Test while phone screen is locked/unlocked
4. [ ] Test with phone tilted (gyro should be available in DualSenseManager.getState())

**Expected**: All inputs work, gyro data available

#### Prerequisites (iOS)
- [ ] iOS 14.5+ device
- [ ] Safari browser
- [ ] DualSense controller

##### TC10: Bluetooth Pairing (iOS)
1. [ ] Follow same pairing steps as TC7
2. [ ] Open Safari and navigate to DREAMengin
3. [ ] Verify connection

**Expected**: Controller connects (haptics may be limited)

---

### Integration Testing

##### TC11: Game Compatibility
Test with existing games:
- [ ] MADMAXI (Babylon.js platformer)
- [ ] Snake
- [ ] Racing Game
- [ ] Space Shooter

**Expected**: All games respond to DualSense input without modifications

##### TC12: GameRemote Compatibility
1. [ ] Open GameRemote (touch controls)
2. [ ] Also connect DualSense
3. [ ] Test both input methods simultaneously
4. [ ] Verify no conflicts

**Expected**: Both input methods work independently

##### TC13: Cross-Tab Remote
1. [ ] Open game in Tab A
2. [ ] Open GameRemote in Tab B
3. [ ] Connect DualSense in Tab A
4. [ ] Test input from both DualSense and Tab B remote
5. [ ] Verify both work

**Expected**: BroadcastChannel and local DualSense both work

##### TC14: DualRuntimeContainer
1. [ ] Launch game in DreamWindow
2. [ ] Connect DualSense
3. [ ] Drag DreamDM Bar (messaging overlay)
4. [ ] Verify game keeps responding to controller
5. [ ] Resize game window
6. [ ] Verify controller still works

**Expected**: Controller input persists through multitasking

---

### Performance Testing

##### TC15: Polling Performance
1. [ ] Open Chrome DevTools → Performance tab
2. [ ] Start recording
3. [ ] Connect DualSense and play for 30 seconds
4. [ ] Stop recording
5. [ ] Check CPU usage of requestAnimationFrame loop

**Expected**: < 1% CPU usage for gamepad polling

##### TC16: Memory Leaks
1. [ ] Open Chrome DevTools → Memory tab
2. [ ] Take heap snapshot
3. [ ] Connect/disconnect DualSense 10 times
4. [ ] Take another heap snapshot
5. [ ] Compare snapshots

**Expected**: No significant memory growth, event listeners cleaned up

##### TC17: Battery Impact (Mobile)
1. [ ] Connect DualSense to Android phone
2. [ ] Play game for 30 minutes with haptics enabled
3. [ ] Check battery drain vs. without controller

**Expected**: Acceptable battery drain (haptics do consume power)

---

### Error Handling

##### TC18: Navigator API Unavailable
1. [ ] Test in browser without Gamepad API support (old browser)
2. [ ] Verify graceful degradation

**Expected**: No JavaScript errors, UI shows "No Controller"

##### TC19: Rapid Connect/Disconnect
1. [ ] Rapidly connect and disconnect DualSense (5 times in 10 seconds)
2. [ ] Verify no crashes or stuck states

**Expected**: Clean state transitions, no errors

##### TC20: Multiple Controllers
1. [ ] Connect DualSense
2. [ ] Connect Xbox controller
3. [ ] Verify first controller is used
4. [ ] Disconnect first controller
5. [ ] Verify second controller is detected

**Expected**: Graceful handling of multiple controllers

---

## Automated Testing

### Unit Tests (Future)

Create these test files:

#### `lib/games/__tests__/DualSenseManager.test.ts`
```typescript
describe('DualSenseManager', () => {
  it('should detect DualSense by vendor ID', () => {
    // Mock gamepad with vendor ID 054c
  });

  it('should apply dead zone to analog inputs', () => {
    // Test dead zone filtering
  });

  it('should clamp rumble intensity to 0-1', () => {
    // Test intensity clamping
  });
});
```

#### `lib/games/__tests__/useGamepad.test.ts`
```typescript
describe('useGamepad', () => {
  it('should detect connection', () => {
    // Test connection event
  });

  it('should fire de-game-input events', () => {
    // Test event firing
  });

  it('should expose rumble function', () => {
    // Test rumble callback
  });
});
```

---

## Regression Testing

Before merging, verify these existing features still work:

- [ ] Keyboard input (arrow keys, WASD, Space, etc.)
- [ ] Touch controls via GameRemote
- [ ] On-screen virtual sticks
- [ ] Cross-tab remote control
- [ ] Game auto-start on selection
- [ ] Quick resume from saved sessions
- [ ] Score saving and leaderboard publishing

---

## Browser Compatibility Matrix

| Browser | Platform | Connection | Input | Haptics | Gyro | Status |
|---------|----------|------------|-------|---------|------|--------|
| Chrome | Windows | ✅ | ✅ | ✅ | ❌ | PASS |
| Chrome | macOS | ✅ | ✅ | ✅ | ❌ | PASS |
| Chrome | Linux | ✅ | ✅ | ✅ | ❌ | PASS |
| Chrome | Android 12+ | ✅ | ✅ | ✅ | ✅ | PASS |
| Edge | Windows | ✅ | ✅ | ✅ | ❌ | PASS |
| Safari | macOS | ✅ | ✅ | ⚠️ | ❌ | PASS |
| Safari | iOS 14.5+ | ✅ | ✅ | ⚠️ | ✅ | PARTIAL |
| Firefox | Windows | ✅ | ✅ | ❌ | ❌ | PARTIAL |

Legend:
- ✅ Full support
- ⚠️ Limited support
- ❌ No support

---

## Sign-off

- [ ] All desktop tests pass
- [ ] All mobile tests pass (Android)
- [ ] All integration tests pass
- [ ] Performance acceptable
- [ ] No regressions found
- [ ] Documentation complete

**Tester**: _________________
**Date**: _________________
**Build**: _________________
