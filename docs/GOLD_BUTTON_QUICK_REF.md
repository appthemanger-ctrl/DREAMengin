# Gold Button & Dual Runtime - Quick Reference

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


## Gold Button Rules (One Sentence)

The Gold button is attached to the top of the DreamDM Bar by default, detaches only when that attached position would go off the top of the screen, locks to the screen while off-screen conditions exist, and reattaches to the top of the box when the bar is dragged back down.

## Dual Runtime Rule (One Sentence)

The top and bottom runtimes must allow the same world to appear in both places at the same time, meaning users can have two Homes open, two DreamSpaces open, or any combination of worlds without the system forcing them to be different.

## Key Constants

```typescript
// DreamDMBar.tsx
const BAR_H = 80;        // Bar height at bottom
const TOP_H = 340;       // Panel height at top
const GOLD_SZ = 64;      // Gold button diameter
const SNAP_UP_PCT = 0.40; // Snap to top when bar > 40% from screen top
const SNAP_DOWN_PX = 88;  // Snap to bottom when dragged down 88px
```

## Gold Button Logic

```typescript
// Calculate attached position
const attachedGoldTop = barTop - GOLD_R;

// Check if off-screen
const isGoldOffScreen = attachedGoldTop < 0;

// Position: screen-locked if off-screen, else attached
const goldTopPx = isGoldOffScreen ? 10 : attachedGoldTop;
```

## Using Dual Runtime

```tsx
import { useDualRuntime } from '@/components/runtime/DualRuntimeContainer';

function MyComponent() {
  const runtime = useDualRuntime();

  // Set runtime content
  runtime.setTopRuntime('home');
  runtime.setBottomRuntime('dreamspace');
  runtime.setTopRuntime({ type: 'dream', id: 'my-dream' });

  // Swap dominance
  runtime.swapDominance();

  // Navigate to Home
  runtime.goToHome();

  // Check if Home is active
  const homeActive = runtime.isHomeActive();

  // Access state
  const { topRuntime, bottomRuntime, dominantRuntime } = runtime.state;
}
```

## Runtime Worlds

```typescript
type RuntimeWorld =
  | 'home'
  | 'dreamspace'
  | 'profile'
  | { type: 'dream'; id: string }
  | { type: 'engin'; name: string }
  | { type: 'custom'; path: string };
```

## Valid Runtime Combinations

✅ Home / Home
✅ DreamSpace / DreamSpace
✅ Home / DreamSpace
✅ DreamSpace / Home
✅ Dream / Dream (same or different)
✅ Any combination

## Gold Button Interactions

| Action | Behavior |
|--------|----------|
| Single tap | Go home + collapse bar if at top |
| Double tap | Open dual menus |
| Swipe down (>30px) | Collapse bar from top to bottom |

## Bar States

| State | Bar Position | Gold Position |
|-------|--------------|---------------|
| Flat/Closed | Bottom (80px) | Attached to top of bar |
| Expanding | Moving up | Follows bar top |
| Middle | Mid-screen | Attached (or screen-locked if off-screen) |
| Top/Panel | Top (340px) | Screen-locked at viewport top |
| Collapsing | Moving down | Reattaches when on-screen |

## Detachment Rules

✅ **ONLY** detaches when attached position goes off-screen at top
❌ Does NOT detach for typing
❌ Does NOT detach for keyboard
❌ Does NOT detach for compose state
❌ Does NOT detach for scroll

## Screen-Locked Mode

When the Gold button is screen-locked:
- Position: `fixed` to viewport
- Top: 10px from viewport top
- Does NOT move with any scroll (feed, page, widget, DreamSpace)
- Has extra glow effect in box-shadow
- Stays locked until bar comes back down

## Double-Tap Gold Behavior

```typescript
// If Home is already active → Refresh Home
// Else → Make Home active top runtime
// Does NOT reset bar position
// Does NOT auto-collapse
```

## Testing Commands

```bash
npm run build     # Build project
npm run test      # Run all tests (493 tests)
npm run test:ci   # Run in CI mode
npm run test:watch # Watch mode
```

## File Locations

| Component | Path |
|-----------|------|
| DreamDMBar | `components/messaging/DreamDMBar.tsx` |
| HomeSystem | `components/home/HomeSystem.tsx` |
| Dual Runtime State | `lib/runtime/dualRuntime.ts` |
| Runtime Container | `components/runtime/DualRuntimeContainer.tsx` |
| Runtime View | `components/runtime/RuntimeView.tsx` |

## Common Patterns

### Checking if Gold is screen-locked

```typescript
const isScreenLocked = attachedGoldTop < 0;
```

### Rendering runtime content

```tsx
<RuntimeView
  world={topRuntime}
  isActive={dominantRuntime === 'top'}
  profile={profile}
  posts={posts}
  isAdmin={isAdmin}
  onOpenDrEams={handleOpenDrEams}
/>
```

### Handling Home navigation

```typescript
const wasHomeActive = dualRuntime.isHomeActive();
dualRuntime.goToHome();

if (wasHomeActive) {
  // This is a refresh
  triggerRefresh();
}
```

## Debug Indicators

In the Gold button style, when screen-locked:
```typescript
boxShadow: `...${isScreenLocked ? ', 0 0 20px rgba(200,152,26,0.6)' : ''}`
```

## Important Notes

1. The Gold button is ALWAYS `position: fixed` (never absolute)
2. Screen-locked means viewport-fixed, scroll-independent
3. Both runtimes can show the same world (Home/Home is valid)
4. Bar drag controls which runtime is dominant
5. Double-tap Gold never resets bar position
6. Typing/keyboard never triggers detachment

---

For complete documentation, see `docs/GOLD_BUTTON_DUAL_RUNTIME.md`
