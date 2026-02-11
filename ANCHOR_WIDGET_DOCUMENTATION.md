# AnchorWidget System - Implementation Documentation

## Overview

The AnchorWidget system is a sophisticated, gesture-driven navigation and widget management system that provides seamless transitions between Home, Profile, and Shrunk modes without any page remounting or traditional routing.

## Architecture

### Core Components

#### 1. State Management (lib/navigation/)

**AnchorStateBuffer.ts**
- Zero-allocation Int32Array[4] buffer for anchor state
- Stores: mode (HOME/PROFILE/SHRUNK), isOpen, holdLatch, prevMode
- Provides atomic mode transitions
- No React re-renders on internal state changes

**AnchorWidgetStorage.ts**
- Persistent storage for anchor widget state
- Manages 8 home slot mappings (HomeSlotWidgetIds[0..7])
- Tracks 12 priority widgets for shrunk mode
- Uses localStorage with idle callback persistence (non-blocking)
- Stores NavStateBuffer snapshots for restoration

#### 2. Widget Communication (lib/widgets/)

**WidgetEventBus.ts**
- In-memory pub/sub system for widget-to-widget messaging
- Synchronous message enqueuing
- Asynchronous processing via microtasks/idle callbacks
- No allocations during gesture frames
- Message format: { fromInstanceId, toWidgetId, type, payload, timestamp }

**WidgetLinkGraph.ts**
- Persisted graph of widget connections
- Capability-based permissions (CAN_SEND_TEXT, CAN_SEND_MEDIA, CAN_SEND_POST, etc.)
- Action mappings for cross-widget operations
- O(1) capability checking

**CrossWidgetPosting.ts**
- Validates POST_REQUEST messages against link graph
- Ensures CAN_SEND_POST capability exists
- Verifies target widget has POST_SINK capability
- Simulates server-validated publishing (ready for real API integration)
- Propagates POST_RESULT back to source widget

#### 3. UI Components (components/)

**AnchorWidget.tsx**
- Single persistent widget mounted after auth, never unmounted
- Gesture handling: tap, hold (420ms), pointer capture
- Hit target and drop target rect caching
- Atomic flip operations between HOME and PROFILE
- Integration with NavStateBuffer and ReturnStack

**HomeSpace.tsx**
- 8 customizable widget slots (0-7)
- Blank widgets by default
- Tap to open action sheet (connect/rename/settings)
- ">" to dock/offscreen without NavState mutation

**ProfileSpace.tsx**
- Freeform widget instance space
- Continuous transform coordinates (no snapping)
- Z-order sorted rendering
- Widget state persists across entry/exit
- Drag-to-anchor close integration

**ShrunkMode.tsx**
- Displays up to 12 priority widgets
- Priority based on: pinned flag, lastFocused timestamp, usage count
- Quick focus/launch capabilities
- Does not change NavState by itself

**DragToAnchorClose.tsx**
- Implements drag-to-anchor close contract
- Widgets in FULL presentation can be dragged to anchor
- Visual feedback when over anchor drop zone
- Transitions widget to prior presentation mode
- No NavState mutation (handled by engine)

**AnchorWidgetOrchestrator.tsx**
- Main controller integrating all components
- Manages NavStateBuffer, ReturnStack, WidgetInstanceMemory
- Handles mode transitions
- Updates priority widgets based on usage
- Coordinates widget lifecycle

## Mode Specifications

### MODE 0: HOME
- Default state
- Home surface foregrounded when open
- Exactly 8 slots (slotIndex 0–7)
- Slot widgets blank unless bound
- Tap anchor to return to HOME-safe state
- ReturnStack pops until HOME layer found

### MODE 1: PROFILE  
- Profile execution envelope foregrounded when open
- Freeform widget instance space
- Entry/exit preserves all widget instance state
- NavState.layer = PROFILE, depth = PROFILE_DEPTH
- ActiveWidgetIndices pointer swapped to ProfileWidgetIndices (O(1))

### MODE 2: SHRUNK
- Anchor collapses visual footprint
- Reveals up to 12 priority widget launchers
- Does not change NavState by itself
- Presentation-only + quick-focus ability
- Restores to prevMode when expanded

## Flip Mechanics (Atomic Transitions)

### HOME → PROFILE Transaction

1. Push current NavSnapshot to ReturnStack
2. Set prevMode = HOME
3. Set mode = PROFILE
4. Update NavState: layer = PROFILE, depth = PROFILE_DEPTH
5. Swap ActiveWidgetIndices pointer to ProfileWidgetIndices (O(1))
6. Set isOpen = true (foreground Profile)
7. **No allocations, no mutations of WidgetInstances[], no React remounts**

### PROFILE → HOME Transaction

1. Set prevMode = PROFILE
2. Set mode = HOME
3. Restore NavState to HOME-safe snapshot (pop ReturnStack until HOME layer)
4. Swap ActiveWidgetIndices pointer to HomeWidgetIndices (O(1))
5. Set isOpen = true (foreground Home)
6. **Profile widgets remain: allocated, mounted, subscribed, stateful**

## Gesture Semantics

### Tap Behavior
- **HOME mode**: Open Home, return to HOME-safe state
- **PROFILE mode**: Open Profile, ensure correct layer/depth
- **SHRUNK mode**: Restore prevMode, ensure correct NavState

### Hold Behavior (420ms threshold)
- Only fires when isOpen = false
- Sets holdLatch = FIRED
- Opens outer Dream selector overlay (not navigation)
- Selector can set NavState.layer = DREAM and swap indices

### Drag-to-Anchor Close
- Any widget in FULL presentation can be closed
- Drag down and release over anchor drop rect
- Transitions widget.presentation FULL → prior (WINDOW/DOCKED/HOME)
- Restores slot mapping if needed
- Persists instance placement change
- No widget instance destruction
- No NavState change unless FULL exit requires depth change

## Widget Interaction Model

### Event Bus Pattern
```typescript
// Subscribe to messages
const unsubscribe = widgetEventBus.subscribe(widgetId, (msg) => {
  console.log('Received:', msg);
});

// Send message
widgetEventBus.send(
  fromInstanceId,
  toWidgetId,
  MSG_TYPE_POST_REQUEST,
  { text: 'Hello', platform: 'twitter' }
);
```

### Link Graph Pattern
```typescript
// Create connection
const linkId = linkGraph.addLink(
  sourceWidgetId,
  targetWidgetId,
  ['CAN_SEND_POST', 'CAN_REQUEST_PUBLISH'],
  { postToPlatform: 'handlePlatformPost' }
);

// Validate capability
const canPost = linkGraph.hasCapability(
  sourceWidgetId,
  targetWidgetId,
  'CAN_SEND_POST'
);
```

### Cross-Widget Posting Flow

1. **Source widget emits POST_REQUEST**:
   ```typescript
   widgetEventBus.send(
     'widget-composer',
     'widget-twitter',
     MSG_TYPE_POST_REQUEST,
     { text: 'My post', mediaIds: ['img1', 'img2'] }
   );
   ```

2. **Engine validates**:
   - Link exists in LinkGraph
   - Link has CAN_SEND_POST capability
   - Target has POST_SINK capability
   - Permissions allow (USER_ONLY vs ADMIN_ONLY)

3. **Engine routes to target**:
   - Target widget translates to platform-specific format
   - Target calls server-validated publish API
   - Server enforces auth, rate limits, constraints

4. **Result propagation**:
   - Target emits POST_RESULT (success/fail)
   - Optional feed update via subscription

## Persistence Strategy

All persistence uses idle callbacks (non-blocking):

**What gets persisted:**
- AnchorStateBuffer (mode, prevMode, isOpen)
- HomeSlotWidgetIds mapping
- PriorityWidgetIds (with lastFocused, pinned, usageCount)
- LinkGraph edges
- NavStateBuffer snapshot (for restore on refresh)
- WidgetInstance transforms and presentations

**How it's persisted:**
```typescript
// Idle callback pattern
AnchorWidgetStorage.saveIdle(state);

// Implemented as:
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => this.save(state));
} else {
  setTimeout(() => this.save(state), 100);
}
```

## Invariants

✅ Anchor exists after auth, never unmounted  
✅ Tap always produces a HOME-safe re-center path  
✅ Flip HOME<->PROFILE is atomic and O(1) index swap  
✅ No widget instance remounts on flip  
✅ ActiveWidgetIndices swaps are O(1)  
✅ ReturnStack guarantees return  
✅ No per-frame allocations in gesture loop  
✅ Zoom mutates NavState depth, never CSS scale  
✅ Cross-widget posting only via explicit LinkGraph + server validation  

## Usage

### Basic Setup

```typescript
import { AnchorWidgetOrchestrator } from '@/components/AnchorWidgetOrchestrator';

export default function App() {
  return (
    <div>
      {/* Your app content */}
      
      {/* Add anchor widget system */}
      <AnchorWidgetOrchestrator />
    </div>
  );
}
```

### Demo Page

Visit `/anchor-demo` to see the full implementation in action:
- Tap the anchor to toggle modes
- Hold for 420ms to trigger Dream selector
- Drag widgets to anchor to close them
- See 8 home slots in HOME mode
- See freeform layout in PROFILE mode
- See priority launchers in SHRUNK mode

## Performance Characteristics

- **Mode transitions**: O(1) - pointer swap only
- **Widget instances**: Pre-allocated, never destroyed
- **Gesture processing**: Zero allocations per frame
- **State updates**: Direct Int32Array mutations
- **Persistence**: Non-blocking idle callbacks
- **Event dispatch**: Asynchronous microtask/idle queue

## Security

- No direct client-side posting to external platforms
- No token storage in widget config
- Tokens live server-side or in Supabase auth session
- Never in user_metadata authorization
- All platform publishing requires server validation
- Link graph enforces capability-based permissions

## Future Enhancements

- Real server-side publish API integration
- More sophisticated Dream selector UI
- Widget marketplace for home slot binding
- Advanced priority ranking algorithms
- Multi-user collaboration on Profile space
- Persistent link graph sync with server
- Analytics on widget usage patterns

## Files Reference

```
lib/navigation/
  ├── AnchorStateBuffer.ts       - State buffer for modes
  ├── AnchorWidgetStorage.ts     - Persistent storage
  └── index.ts                   - Exports

lib/widgets/
  ├── WidgetEventBus.ts          - Event pub/sub
  ├── WidgetLinkGraph.ts         - Connection graph
  └── CrossWidgetPosting.ts      - Posting engine

components/
  ├── AnchorWidget.tsx           - Main anchor widget
  ├── HomeSpace.tsx              - 8-slot home surface
  ├── ProfileSpace.tsx           - Freeform profile surface
  ├── ShrunkMode.tsx             - Priority launchers
  ├── DragToAnchorClose.tsx      - Drag-to-close
  └── AnchorWidgetOrchestrator.tsx - Main orchestrator

app/
  └── anchor-demo/
      └── page.tsx               - Demo page
```

## Testing

Build verification:
```bash
npm run build
```

Type checking:
```bash
npm run typecheck
```

All tests pass with no errors in the AnchorWidget implementation.
