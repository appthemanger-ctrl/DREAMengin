# Widget System V2 - Maximum Technical Hosting Specification

## Overview

This implementation provides a complete widget system where **Feed is just a bindable host mode** within the widget system, not a separate system. The architecture separates widget identity/behavior (WidgetDefinition) from placement/transform (WidgetInstance).

## Core Concepts

### 1. Widget Definition (Identity + Behavior)
- **Immutable identity**: widget_id, owner_id, name
- **Bindable behavior**: host_kind, host_config
- **Validation**: host_config is automatically normalized and validated
- **Security**: policy bits control permissions

### 2. Widget Instance (Placement + Transform)
- **Surface placement**: HOME, FACE, PROFILE, DOCK
- **Transform state**: x, y, scale, rotation, opacity (Float32Array[5])
- **Presentation**: TILE, WINDOW, DOCKED, FULL
- **Z-ordering**: z_index, focus_rank

### 3. Feed as Host Mode
- **Default scope**: SELF (user's own feed)
- **FOLLOW scope**: Requires server-side relationship verification
- **Server-enforced**: Cannot bypass follow verification from client
- **Normalized config**: All fields validated and canonicalized

## Database Schema

### widget_definitions
```sql
- widget_id: UUID (PK)
- owner_id: UUID (FK to profiles)
- name: TEXT
- host_kind: SMALLINT (1=HOST_FEED_VIEW, 2=HOST_COMPOSITE)
- host_config: JSONB (normalized)
- settings: JSONB
- policy: INTEGER (flags)
- created_at, updated_at: TIMESTAMPTZ
```

### widget_instances
```sql
- instance_id: UUID (PK)
- widget_id: UUID (FK to widget_definitions)
- owner_id: UUID (FK to profiles)
- surface: SMALLINT (0=HOME, 1=FACE, 2=PROFILE, 3=DOCK)
- surface_key: INTEGER
- slot_index: SMALLINT (-1 or 0-7)
- presentation: SMALLINT (0=TILE, 1=WINDOW, 2=DOCKED, 3=FULL)
- transform_x, transform_y, transform_scale, transform_rotation, transform_opacity: REAL
- z_index, focus_rank: INTEGER
- runtime_flags: INTEGER
- created_at, updated_at: TIMESTAMPTZ
```

## TypeScript Types

All types are defined in `types/widget-system-v2.ts`:

```typescript
import {
  HostKind,
  Surface,
  PresentationMode,
  FeedScope,
  FeedSort,
  type WidgetDefinition,
  type WidgetInstance,
  type FeedHostConfig,
  type HostResolved,
} from '@/types/widget-system-v2';
```

## Usage Examples

### Creating a Feed Widget

```typescript
// 1. Create widget definition
const definition = await supabase
  .from('widget_definitions')
  .insert({
    owner_id: userId,
    name: 'My Feed',
    host_kind: HostKind.HOST_FEED_VIEW,
    host_config: {
      scope: FeedScope.SELF,
      target_user_id: null,
      filters: {},
      sort: FeedSort.RECENT,
      limit: 25,
      realtime: true,
      include_media: true,
      include_reposts: false,
    },
    policy: 0,
  })
  .select()
  .single();

// 2. Create widget instance
const instance = await supabase
  .from('widget_instances')
  .insert({
    widget_id: definition.data.widget_id,
    owner_id: userId,
    surface: Surface.HOME,
    surface_key: 0,
    slot_index: -1,
    presentation: PresentationMode.TILE,
    transform_x: 0,
    transform_y: 0,
    transform_scale: 1,
    transform_rotation: 0,
    transform_opacity: 1,
    z_index: 0,
  })
  .select()
  .single();
```

### Creating a FOLLOW Scope Feed Widget

```typescript
const followFeedConfig: FeedHostConfig = {
  scope: FeedScope.FOLLOW,
  target_user_id: 'user-uuid-to-follow',
  filters: {
    tags: ['tech', 'science'],
  },
  sort: FeedSort.RECENT,
  limit: 50,
  realtime: true,
  include_media: true,
  include_reposts: true,
};

// This will be verified server-side
// If the user doesn't follow target_user_id, resolver returns FORBIDDEN status
```

### Resolving Feed Data

```typescript
// Client-side: Call the API
const response = await fetch('/api/widgets/feed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ instance_id: widgetInstanceId }),
});

const resolved: HostResolved = await response.json();

if (resolved.status === 'OK') {
  // Display feed items
  resolved.items.forEach(item => {
    console.log(item.text_preview);
  });
} else if (resolved.status === 'FORBIDDEN') {
  // Show access denied message
  console.error('Access denied:', resolved.error_message);
}
```

### Server-side: Using the Resolver Directly

```typescript
import { resolveFeedHost } from '@/lib/widgets/feed-resolver';

const resolved = await resolveFeedHost(userId, feedHostConfig);

if (resolved.status === HostResolvedStatus.OK) {
  // Feed data is available in resolved.items
}
```

### Realtime Subscriptions

```typescript
import { subscribeFeedRealtime } from '@/lib/widgets/feed-resolver';

const unsubscribe = await subscribeFeedRealtime(
  userId,
  feedHostConfig,
  (updatedItems) => {
    // Handle feed updates
    // This runs in idle callback, not during gestures
    setFeedItems(updatedItems);
  }
);

// Later: cleanup
unsubscribe();
```

## Security Features

### 1. Server-Side Follow Verification
- FOLLOW scope requires verified relationship in `follows` table
- Verification happens server-side, cannot be bypassed
- If verification fails, returns FORBIDDEN status

### 2. Row Level Security
- All widget tables have RLS enabled
- Users can only access their own widgets
- No way to query other users' widget data

### 3. Policy Bits
```typescript
enum PolicyBits {
  USER_ONLY = 1 << 0,          // Widget only for owner
  ADMIN_ONLY = 1 << 1,         // Widget only for admins
  PUBLIC_PREVIEW_ALLOWED = 1 << 2,  // Can be previewed publicly
}
```

## Performance Guarantees

### During Active Gestures
- ✅ Zero allocations per frame
- ✅ No network calls
- ✅ No JSON parsing
- ✅ Transform updates by engine only
- ✅ Widgets never handle pinch/zoom

### Feed Updates
- ✅ Applied via requestIdleCallback
- ✅ Debounced in batches
- ✅ Never during gesture frames
- ✅ Proper caching with ETags

## Default Behavior

When a new user is created (via trigger):
1. Automatically creates a default feed widget definition (SELF scope)
2. Creates a widget instance on HOME surface
3. Placed in TILE presentation mode
4. Configured with sensible defaults (25 items, realtime enabled)

## Migration

To apply the database migration:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL file
psql -f supabase/migrations/20260210000000_widget_system_v2.sql
```

## API Reference

### POST /api/widgets/feed
Resolves feed data for a widget instance.

**Request:**
```json
{
  "instance_id": "widget-instance-uuid"
}
```

**Response (OK):**
```json
{
  "kind": 1,
  "status": "OK",
  "items": [
    {
      "item_id": "uuid",
      "author_id": "uuid",
      "created_at": "2026-02-10T07:00:00Z",
      "text_preview": "Feed item text...",
      "media_preview_url": "https://...",
      "engagement_counts": { "likes": 5, "comments": 2, "shares": 1 },
      "visibility": "public"
    }
  ],
  "cursor": null,
  "etag": "\"25-2026-02-10T07:00:00Z\"",
  "updated_at": "2026-02-10T07:30:00Z"
}
```

**Response (FORBIDDEN):**
```json
{
  "kind": 1,
  "status": "FORBIDDEN",
  "error_message": "Access denied: follow relationship required"
}
```

### GET /api/widgets/feed?instance_id={id}
Same as POST but via query parameter.

## Widget Actions

Widget action sheet commands:
- `REBIND_SCOPE`: Switch between SELF/FOLLOW
- `SET_TARGET_USER`: Change followed user
- `SET_FILTERS`: Update feed filters
- `SET_SORT`: Change sort order
- `TOGGLE_REALTIME`: Enable/disable realtime
- `DOCK`: Dock widget to edge
- `RENAME`: Rename widget
- `SETTINGS`: Open widget settings

## Composite Widgets

For multi-host composition:

```typescript
const compositeConfig: CompositeHostConfig = {
  panes: [
    {
      pane_id: 'feed-1',
      host_kind: HostKind.HOST_FEED_VIEW,
      host_config: { scope: FeedScope.SELF, /* ... */ },
      layout: { position: { x: 0, y: 0 }, size: { width: 50, height: 100 } },
    },
    {
      pane_id: 'feed-2',
      host_kind: HostKind.HOST_FEED_VIEW,
      host_config: { scope: FeedScope.FOLLOW, target_user_id: 'uuid', /* ... */ },
      layout: { position: { x: 50, y: 0 }, size: { width: 50, height: 100 } },
    },
  ],
  layout_mode: 'split',
};
```

## Testing

```bash
# Type checking
npm run typecheck

# Build
npm run build

# Run tests (when available)
npm test
```

## Architecture Decisions

1. **Feed is a Host Mode**: Not a separate system, but a bindable host within widgets
2. **Default Scope is SELF**: Users see their own feed by default
3. **Server Verification**: FOLLOW scope verified server-side, mandatory
4. **Engine Owns Zoom**: Widgets never handle pinch gestures
5. **Strict Validation**: All configs normalized and canonicalized
6. **Performance First**: Zero allocations during gestures

## Future Enhancements

- [ ] Additional host kinds (e.g., HOST_TIMELINE, HOST_GALLERY)
- [ ] Pagination support (cursor-based)
- [ ] Advanced filtering (date ranges, content types)
- [ ] Widget templates
- [ ] Import/export widget configurations
- [ ] Analytics and metrics
