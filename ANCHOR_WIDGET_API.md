# AnchorWidget API Reference

## Table of Contents
- [Core Classes](#core-classes)
- [React Components](#react-components)
- [Event Bus API](#event-bus-api)
- [Link Graph API](#link-graph-api)
- [Storage API](#storage-api)
- [Example Usage](#example-usage)

## Core Classes

### AnchorStateBuffer

Zero-allocation state buffer for anchor widget modes.

```typescript
import { AnchorStateBuffer, MODE_HOME, MODE_PROFILE, MODE_SHRUNK } from '@/lib/navigation';

const anchorState = new AnchorStateBuffer();

// Mode management
anchorState.mode = MODE_HOME;
anchorState.switchToProfile();
anchorState.switchToShrunk();
anchorState.restoreFromShrunk(); // Restores prevMode

// Open/close
anchorState.open();
anchorState.close();
anchorState.toggleOpen();

// State access
const isOpen = anchorState.isOpen;      // boolean
const mode = anchorState.mode;          // number
const prevMode = anchorState.prevMode;  // number

// Persistence
const snapshot = anchorState.snapshot();
anchorState.restore(snapshot);

// Validation
const isValid = anchorState.isValid();
console.log(anchorState.toString()); // "AnchorState{mode=HOME, isOpen=true, ...}"
```

### NavStateBuffer

Navigation state buffer (existing, extended for anchor widget).

```typescript
import { NavStateBuffer, LAYER_HOME, LAYER_PROFILE, PROFILE_DEPTH } from '@/lib/navigation';

const navState = new NavStateBuffer();

// Layer and depth
navState.layer = LAYER_PROFILE;
navState.depth = PROFILE_DEPTH;

// Profile check
const isProfile = navState.isProfileActive();

// Snapshot
const snapshot = navState.snapshot();
navState.restore(snapshot);
```

### WidgetInstanceMemory

Manages pre-allocated widget instances with O(1) context switching.

```typescript
import { WidgetInstanceMemory } from '@/lib/navigation';

const widgetMemory = new WidgetInstanceMemory();

// Initialize with instances
widgetMemory.initialize([
  {
    instanceId: 'widget-1',
    ownerId: 'user-1',
    context: 'HOME',
    transformState: { x: 0, y: 0, scale: 1, rotation: 0 },
    zIndex: 1,
    presentation: 'FLOATING',
    bindingType: 'STATIC',
    bindingConfig: {},
    visibility: 'ACTIVE',
    internalState: {}
  }
]);

// O(1) context switching
widgetMemory.switchToProfile();
widgetMemory.switchToHome();

// Get active widgets
const activeWidgets = widgetMemory.getActiveWidgets();

// Update widget
widgetMemory.updateTransform('widget-1', { x: 100, y: 100 });
widgetMemory.updatePresentation('widget-1', 'FULL');
```

## React Components

### AnchorWidget

Main anchor widget component with gesture handling.

```typescript
import { AnchorWidget } from '@/components/AnchorWidget';
import { NavStateBuffer, ReturnStack, WidgetInstanceMemory } from '@/lib/navigation';

const navState = new NavStateBuffer();
const returnStack = new ReturnStack();
const widgetMemory = new WidgetInstanceMemory();

<AnchorWidget
  navStateBuffer={navState}
  returnStack={returnStack}
  widgetMemory={widgetMemory}
  onDreamSelectorOpen={() => console.log('Dream selector opened')}
  onRectUpdate={(rect) => console.log('Anchor rect:', rect)}
/>
```

**Props:**
- `navStateBuffer: NavStateBuffer` - Navigation state buffer
- `returnStack: ReturnStack` - Return stack for navigation history
- `widgetMemory: WidgetInstanceMemory` - Widget instance memory
- `onDreamSelectorOpen?: () => void` - Called when hold gesture triggers
- `onRectUpdate?: (rect) => void` - Called when anchor rect changes

### HomeSpace

8-slot home surface component.

```typescript
import { HomeSpace } from '@/components/HomeSpace';
import type { HomeSlotMapping } from '@/lib/navigation';

const homeSlots: HomeSlotMapping[] = [
  { slotIndex: 0, widgetId: 'widget-1' },
  { slotIndex: 1, widgetId: null }, // blank
  // ... up to index 7
];

<HomeSpace
  homeSlots={homeSlots}
  onSlotTap={(slotIndex) => console.log('Tapped slot:', slotIndex)}
  onSlotUpdate={(slotIndex, widgetId) => console.log('Updated slot:', slotIndex, widgetId)}
/>
```

### ProfileSpace

Freeform widget layout with drag-to-close.

```typescript
import { ProfileSpace } from '@/components/ProfileSpace';
import type { WidgetInstanceRecord } from '@/lib/navigation';

const widgets: WidgetInstanceRecord[] = [
  // ... widget instances
];

const anchorRect = { x0: 100, y0: 500, x1: 200, y1: 600 };

<ProfileSpace
  widgets={widgets}
  onWidgetFocus={(widgetId) => console.log('Focused:', widgetId)}
  onWidgetClose={(widgetId) => console.log('Closed:', widgetId)}
  anchorRect={anchorRect}
/>
```

### ShrunkMode

12 priority widget launchers.

```typescript
import { ShrunkMode } from '@/components/ShrunkMode';
import type { PriorityWidget } from '@/lib/navigation';

const priorityWidgets: PriorityWidget[] = [
  {
    widgetId: 'widget-1',
    lastFocused: Date.now(),
    pinned: true,
    usageCount: 42
  },
  // ... up to 12 widgets
];

<ShrunkMode
  priorityWidgets={priorityWidgets}
  onWidgetSelect={(widgetId) => console.log('Selected:', widgetId)}
/>
```

### DragToAnchorClose

Wrapper for drag-to-close functionality.

```typescript
import { DragToAnchorClose, DragHandle } from '@/components/DragToAnchorClose';

const anchorRect = { x0: 100, y0: 500, x1: 200, y1: 600 };

<DragToAnchorClose
  anchorRect={anchorRect}
  onClose={() => console.log('Widget closed')}
>
  <div className="my-widget">
    <DragHandle />
    <div className="content">Widget content</div>
  </div>
</DragToAnchorClose>
```

## Event Bus API

### WidgetEventBus

In-memory pub/sub for widget communication.

```typescript
import { widgetEventBus, type WidgetMsg } from '@/lib/widgets/WidgetEventBus';

// Subscribe to messages
const unsubscribe = widgetEventBus.subscribe('my-widget', (msg: WidgetMsg) => {
  console.log('Received message:', msg);
  console.log('From:', msg.fromInstanceId);
  console.log('Type:', msg.type);
  console.log('Payload:', msg.payload);
});

// Send message
widgetEventBus.send(
  'source-widget',      // from
  'target-widget',      // to
  1,                    // type (e.g., MSG_TYPE_POST_REQUEST)
  { text: 'Hello!' }    // payload
);

// Emit raw message
widgetEventBus.emit({
  fromInstanceId: 'source-widget',
  toWidgetId: 'target-widget',
  type: 1,
  payload: { text: 'Hello!' },
  timestamp: Date.now()
});

// Cleanup
unsubscribe();
widgetEventBus.clear();
```

### Message Types

```typescript
import {
  MSG_TYPE_POST_REQUEST,
  MSG_TYPE_POST_RESULT,
  MSG_TYPE_FOCUS_REQUEST,
  MSG_TYPE_SEND_TEXT,
  MSG_TYPE_SEND_MEDIA
} from '@/lib/widgets/CrossWidgetPosting';

// Custom types should be > 100 to avoid conflicts
const MSG_TYPE_CUSTOM = 101;
```

## Link Graph API

### WidgetLinkGraph

Manages widget connections with capability-based permissions.

```typescript
import { WidgetLinkGraph, type CapabilityMask } from '@/lib/widgets/WidgetLinkGraph';

const linkGraph = new WidgetLinkGraph();

// Add widgets
linkGraph.addWidget('widget-1');
linkGraph.addWidget('widget-2');

// Create link
const linkId = linkGraph.addLink(
  'widget-1',                           // source
  'widget-2',                           // target
  ['CAN_SEND_POST', 'CAN_SEND_TEXT'],  // capabilities
  {                                     // action map
    'postToPlatform': 'handlePost',
    'sendText': 'handleText'
  }
);

// Check capabilities
const canPost = linkGraph.hasCapability('widget-1', 'widget-2', 'CAN_SEND_POST');
const canText = linkGraph.hasCapability('widget-1', 'widget-2', 'CAN_SEND_TEXT');

// Get links
const outgoing = linkGraph.getOutgoingLinks('widget-1');
const incoming = linkGraph.getIncomingLinks('widget-2');

// Get action handler
const handler = linkGraph.getActionHandler('widget-1', 'widget-2', 'postToPlatform');

// Validate message
const isValid = linkGraph.validateMessage('widget-1', 'widget-2', 'CAN_SEND_POST');

// Remove link
linkGraph.removeLink(linkId);

// Export for persistence
const nodes = linkGraph.export();

// Initialize from persisted data
linkGraph.initialize(nodes);
```

### Capability Masks

```typescript
type CapabilityMask = 
  | 'CAN_SEND_TEXT'
  | 'CAN_SEND_MEDIA'
  | 'CAN_SEND_POST'
  | 'CAN_REQUEST_PUBLISH'
  | 'CAN_REQUEST_OPEN'
  | 'CAN_REQUEST_FOCUS';
```

## Storage API

### AnchorWidgetStorage

Persistent storage for anchor widget state.

```typescript
import { AnchorWidgetStorage, type AnchorWidgetState } from '@/lib/navigation';

// Create initial state
const state = AnchorWidgetStorage.createInitialState();

// Load from storage
const loadedState = await AnchorWidgetStorage.load();

// Save state
await AnchorWidgetStorage.save(state);

// Save with idle callback (non-blocking)
AnchorWidgetStorage.saveIdle(state);

// Slot management
const widgetId = AnchorWidgetStorage.getSlotWidget(state, 0);
AnchorWidgetStorage.setSlotWidget(state, 0, 'widget-1');

// Priority management
AnchorWidgetStorage.updatePriorities(state, 'widget-1');

// Clear storage (for testing)
AnchorWidgetStorage.clear();
```

### State Structure

```typescript
interface AnchorWidgetState {
  mode: number;                      // 0=HOME, 1=PROFILE, 2=SHRUNK
  prevMode: number;                  // Previous non-shrunk mode
  isOpen: boolean;                   // Open/closed state
  homeSlots: HomeSlotMapping[];      // 8 home slots
  priorityWidgets: PriorityWidget[]; // Up to 12 priority widgets
  navSnapshot: Int32Array | null;    // Navigation state snapshot
}

interface HomeSlotMapping {
  slotIndex: number;    // 0-7
  widgetId: string | null;
}

interface PriorityWidget {
  widgetId: string;
  lastFocused: number;  // timestamp
  pinned: boolean;
  usageCount?: number;
}
```

## Example Usage

### Complete Integration

```typescript
'use client';

import { AnchorWidgetOrchestrator } from '@/components/AnchorWidgetOrchestrator';

export default function MyApp() {
  return (
    <div className="min-h-screen">
      <header>My App</header>
      
      <main>
        {/* Your app content */}
      </main>
      
      {/* Add anchor widget system */}
      <AnchorWidgetOrchestrator />
    </div>
  );
}
```

### Custom Widget with Event Bus

```typescript
'use client';

import { useEffect } from 'react';
import { widgetEventBus } from '@/lib/widgets/WidgetEventBus';
import { MSG_TYPE_POST_REQUEST } from '@/lib/widgets/CrossWidgetPosting';

export function MyWidget({ widgetId }: { widgetId: string }) {
  useEffect(() => {
    // Subscribe to messages
    const unsubscribe = widgetEventBus.subscribe(widgetId, (msg) => {
      console.log('Received:', msg);
      
      if (msg.type === MSG_TYPE_POST_REQUEST) {
        // Handle post request
        handlePost(msg.payload);
      }
    });
    
    return () => unsubscribe();
  }, [widgetId]);
  
  const sendMessage = () => {
    widgetEventBus.send(
      widgetId,
      'target-widget',
      MSG_TYPE_POST_REQUEST,
      { text: 'Hello from MyWidget!' }
    );
  };
  
  return (
    <div>
      <button onClick={sendMessage}>Send Message</button>
    </div>
  );
}
```

### Custom Link Creation

```typescript
import { WidgetLinkGraph } from '@/lib/widgets/WidgetLinkGraph';
import { CrossWidgetPostingEngine } from '@/lib/widgets/CrossWidgetPosting';

// Initialize systems
const linkGraph = new WidgetLinkGraph();
const postingEngine = new CrossWidgetPostingEngine(linkGraph);

// Register widget capabilities
postingEngine.registerWidget('composer-widget', {
  canSendPost: true,
  canReceivePost: false,
  canSendText: true,
  canSendMedia: true,
  canRequestFocus: false
});

postingEngine.registerWidget('twitter-widget', {
  canSendPost: false,
  canReceivePost: true, // POST_SINK
  canSendText: false,
  canSendMedia: false,
  canRequestFocus: false
});

// Create posting link
const linkId = postingEngine.createPostingLink(
  'composer-widget',
  'twitter-widget',
  {
    'postToPlatform': 'handleTwitterPost',
    'publishDraft': 'handlePublish'
  }
);

// Now composer can send posts to twitter widget
widgetEventBus.send(
  'composer-widget',
  'twitter-widget',
  MSG_TYPE_POST_REQUEST,
  {
    text: 'My tweet',
    mediaIds: ['img1.jpg'],
    targetPlatform: 'twitter'
  }
);
```

## Performance Tips

1. **Use O(1) operations**: Mode transitions use pointer swaps, not data copying
2. **Avoid allocations in gesture handlers**: Use Int32Array buffers for state
3. **Non-blocking persistence**: Always use `saveIdle()` instead of `save()`
4. **Pre-allocate widgets**: Initialize WidgetInstanceMemory once at startup
5. **Batch updates**: Group multiple state changes before triggering re-renders

## Security Best Practices

1. **Never store tokens in widget config**: Use server-side storage
2. **Validate all cross-widget messages**: Use link graph capabilities
3. **Server-side publish validation**: Don't trust client-side posting
4. **Rate limiting**: Implement on server for all publish operations
5. **Audit logging**: Track all cross-widget communication server-side

## Debugging

```typescript
// Enable debug mode
localStorage.setItem('ANCHOR_DEBUG', 'true');

// Check anchor state
console.log(anchorState.toString());

// Check nav state
console.log(navState.toString());

// Check active widgets
console.log(widgetMemory.getActiveWidgets());

// Check event bus queue
console.log(widgetEventBus.getQueueSize());

// Check link graph
console.log(linkGraph.export());
```
