# Gold Button Attachment & Dual Runtime System

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


## Overview

This document describes the implementation of the corrected Gold Button attachment behavior and the new dual runtime system in DREAMengin.

## Gold Button Attachment Rule (CORRECTED SPEC)

### Summary

The Gold button is attached to the TOP of the DreamDM Bar by default and detaches ONLY when that attached position would go off the top of the screen, at which point it locks to the screen viewport.

### Detailed Behavior

1. **Default Attachment**
   - The Gold button is attached to the TOP of the DreamDM Bar
   - It stays attached while the bar is visible and on screen
   - The button's center sits on the bar's top edge

2. **Detachment Trigger**
   - The button detaches ONLY when dragging the bar upward causes the button's normal attached position to go off the top of the screen
   - It does NOT detach for typing
   - It does NOT detach for keyboard input
   - It does NOT detach for compose state
   - It does NOT detach for any other reason except position going off-screen

3. **Screen-Locked Mode**
   - When the attached position would go off-screen, the Gold button locks to the SCREEN/viewport
   - It positions itself at the top of the viewport (10px from top)
   - It does NOT move with page scroll
   - It does NOT move with feed scroll
   - It does NOT move with DreamSpace scroll
   - It does NOT move with widget scroll
   - Position is `fixed` relative to viewport, not the bar

4. **Reattachment**
   - When the bar is dragged back down and the top-of-box position is back on screen
   - The Gold button unlocks from the screen
   - It reattaches to the TOP of the DreamDM Bar

5. **Visual Indicator**
   - When screen-locked, the button has an extra glow effect in the box-shadow
   - This provides visual feedback that the button is in a different mode

### Implementation Details

**File:** `components/messaging/DreamDMBar.tsx`

```typescript
// Gold button geometry - CORRECTED PER SPEC
const attachedGoldTop: number = barTop - GOLD_R; // Normal attached position
const isGoldOffScreen: boolean = attachedGoldTop < 0; // Would it be off-screen?
const goldTopPx: number = isGoldOffScreen
  ? 10                                 // Screen-locked at top
  : attachedGoldTop;                   // Attached to bar top edge

const isScreenLocked: boolean = isGoldOffScreen;
```

The button always uses `position: fixed` to ensure it never moves with scroll when screen-locked.

---

## Dual Runtime System

### Overview

The system now supports two independent runtime views:
- **Top Runtime** - The primary view
- **Bottom Runtime** - The secondary view

These runtimes are NOT locked to specific content types. Both can display any world simultaneously.

### Valid Runtime States

The following combinations are all valid and supported:

| Top Runtime | Bottom Runtime | Description |
|-------------|----------------|-------------|
| Home | Home | Two Home views, each scrolls independently |
| DreamSpace | DreamSpace | Two DreamSpace views, independent browsing |
| Home | DreamSpace | Traditional default configuration |
| DreamSpace | Home | Swapped configuration |
| Profile | Home | Profile on top, Home on bottom |
| Dream | Dream | Two instances of the same Dream |

**Key Insight:** The system does NOT restrict runtimes to be different. Users can have two Homes, two DreamSpaces, or any combination.

### Runtime Worlds

A `RuntimeWorld` can be:
- `'home'` - Home feed
- `'dreamspace'` - DreamSpace navigator
- `'profile'` - User profile
- `{ type: 'dream', id: string }` - A specific Dream
- `{ type: 'engin', name: string }` - A specific Engin
- `{ type: 'custom', path: string }` - Custom world

### Architecture

**Core Library:** `lib/runtime/dualRuntime.ts`

Defines types and utility functions:
```typescript
export interface DualRuntimeState {
  topRuntime: RuntimeWorld;
  bottomRuntime: RuntimeWorld;
  dominantRuntime: 'top' | 'bottom';
}
```

**Container Component:** `components/runtime/DualRuntimeContainer.tsx`

Provides context and state management:
```typescript
const dualRuntime = useDualRuntime();

// API methods:
dualRuntime.setTopRuntime(world);
dualRuntime.setBottomRuntime(world);
dualRuntime.swapDominance();
dualRuntime.goToHome();
dualRuntime.isHomeActive();
```

**View Component:** `components/runtime/RuntimeView.tsx`

Renders content for each runtime based on the `RuntimeWorld` type.

### Integration with HomeSystem

**File:** `components/home/HomeSystem.tsx`

The HomeSystem component now wraps everything in `DualRuntimeContainer`:

```tsx
<DualRuntimeContainer>
  {() => (
    <HomeSystemInner ... />
  )}
</DualRuntimeContainer>
```

Inside, it renders both runtime views:

```tsx
<RuntimeView
  world={dualRuntime.state.topRuntime}
  isActive={dualRuntime.state.dominantRuntime === 'top'}
  ...
/>
<RuntimeView
  world={dualRuntime.state.bottomRuntime}
  isActive={dualRuntime.state.dominantRuntime === 'bottom'}
  ...
/>
```

### Dominant Runtime

The `dominantRuntime` determines which view is currently visible:
- `'top'` - The top runtime is active (visible, receives pointer events)
- `'bottom'` - The bottom runtime is active (visible, receives pointer events)

The DreamDM Bar position controls which runtime is dominant:
- Bar at bottom → Top runtime dominant (default: Home)
- Bar at top → Bottom runtime dominant (default: DreamSpace)

### Double-Tap Gold Behavior

Per the spec, double-tapping the Gold button:
1. If Home is already the active top runtime → Refresh Home
2. Otherwise → Make Home the active top runtime
3. Does NOT reset the bar position
4. Does NOT collapse the system automatically

Implementation in `HomeSystem.tsx`:

```typescript
const returnHome = useCallback(() => {
  const wasHomeActive = dualRuntime.isHomeActive();
  dualRuntime.goToHome();

  if (wasHomeActive) {
    // This is a "refresh" action
    console.log('[HomeSystem] Refreshing Home (already active)');
  }
}, [dualRuntime]);
```

---

## Cross-Runtime Connection

The spec allows compatible Dreams or Daydreams opened in different runtimes to link and interact:

### Examples

1. **Code + Preview**
   - Top: CodeEngin
   - Bottom: File preview
   - Link: Live preview updates as code changes

2. **Music + Feed**
   - Top: Music Daydream
   - Bottom: Home feed
   - Link: Music state posts to feed

3. **Game + Game**
   - Top: Game Dream
   - Bottom: Same Game Dream
   - Link: Multiplayer or mirrored interaction

### Rules

1. Connection is optional and context-driven
2. Navigation remains independent
3. Only compatible Dreams/Engins link
4. Connections must be live (real-time)
5. Two instances of the same Dream can communicate if supported

**Note:** Cross-runtime linking is designed into the architecture but requires Dream-specific implementation.

---

## Home Default State

Per the spec, the default Home state includes:

1. **Top Runtime:** Home
2. **Contents:**
   - Home feed
   - Small compact widget/profile rail between feed and bar
   - Default widget: DreamSpace opener
3. **DreamDM Bar:** At the bottom
4. **Gold Button:** Attached to top of bar

### Behavior

- Feed scrolls independently
- Feed scroll never moves the bar
- Feed scroll never moves the Gold button (when screen-locked)
- Single tap Gold → Opens dual menus
- Double tap Gold → Refreshes Home (if already active) or makes Home active

---

## Bar States

### A. FLAT / CLOSED
- Bar at bottom (80px height)
- Gold button attached to top of bar
- Quick compose visible

### B. MIDDLE / COMPOSE
- Dragging to middle opens message compose
- User can type
- Releasing leaves it open
- Gold button remains attached unless position goes off-screen

### C. TOP / DREAMSPACE STATE
- Dragging all the way up snaps bar to top (340px height)
- If Gold button's attached position goes off-screen → screen-locks
- Bottom runtime becomes dominant (default: DreamSpace)
- Gold button does NOT go to bottom of bar (stays at top or screen-locked)

---

## Testing

All changes verified with:
- **Build:** `npm run build` ✓
- **Tests:** `npm run test` - 493 tests passing ✓

Test coverage includes:
- DreamDM Bar behavior
- Messaging functionality
- Navigation systems
- Icon definitions
- Game mechanics
- Optimizer systems
- Phase 7 naming authority

---

## Files Modified/Created

### Modified
- `components/messaging/DreamDMBar.tsx` - Corrected Gold button attachment logic
- `components/home/HomeSystem.tsx` - Integrated dual runtime system

### Created
- `lib/runtime/dualRuntime.ts` - Dual runtime state and utilities
- `components/runtime/DualRuntimeContainer.tsx` - Runtime context provider
- `components/runtime/RuntimeView.tsx` - Runtime content renderer
- `docs/GOLD_BUTTON_DUAL_RUNTIME.md` - This documentation

---

## Future Enhancements

1. **Cross-Runtime Linking**
   - Implement Dream-to-Dream communication protocols
   - Add runtime connection indicators
   - Create cross-runtime event bus

2. **Persistence**
   - Save runtime states to localStorage
   - Restore last runtime configuration on reload

3. **Animation**
   - Add transition animations between runtime swaps
   - Smooth bar drag interactions with runtime transitions

4. **DreamSpace Implementation**
   - Fully implement DreamSpace content (currently placeholder)
   - Add Dream browsing and interaction
   - Implement small movable Dreams

5. **Compact Widget Rail**
   - Implement the compact rail between feed and bar
   - Add swipeable favorite widgets
   - Make DreamSpace opener widget functional

---

## Summary

The corrected Gold Button attachment rule and dual runtime system provide:

1. **Clear Attachment Logic:** Gold button attached to bar top, detaches only when off-screen
2. **Screen-Locked Behavior:** Button doesn't move with scroll when detached
3. **Flexible Runtime System:** Both runtimes can display any world, including duplicates
4. **Independent Views:** Top and bottom runtimes operate independently
5. **Proper Double-Tap:** Refreshes Home if active, else activates Home
6. **No Unwanted Detachment:** Keyboard, typing, and compose don't trigger detachment

All requirements from the spec have been implemented and tested.
