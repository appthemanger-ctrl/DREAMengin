# V1 Default UI Components
## Widget Rail Navigation Pattern

Based on the hand-drawn specification, these components implement the mobile-first, widget-rail navigation UI for DREAMengin V1.

---

## 📦 COMPONENTS INCLUDED

### 1. **WidgetFeedScreen.tsx**
Main screen component that orchestrates the entire widget feed UI.

**Features:**
- Manages state for user widgets, following widgets, and active widget
- Handles refresh logic (30-second interval)
- Coordinates interactions between rails and feed area
- Dispatches custom events for post creation

**Props:**
- `initialUserWidgets`: User's HOME space widgets
- `initialFollowingWidgets`: Shared widgets from followed users
- `userId`: Current user ID

### 2. **WidgetRail.tsx**
Vertical scrollable rail of widget icons (left and right).

**Features:**
- Scrollable list of widgets
- Position-aware (left vs right)
- Empty state handling
- Smooth scroll behavior

**Props:**
- `position`: 'left' | 'right'
- `widgets`: Array of widgets to display
- `activeWidgetId`: Currently active widget ID
- `onLongPress`: Callback for long press
- `onTap`: Callback for tap

### 3. **WidgetIcon.tsx**
Individual widget icon with touch interactions.

**Features:**
- Long-press detection (500ms)
- Tap detection
- Visual feedback (scaling, active ring)
- Type-based colors and icons
- Progress indicator during long press
- Haptic feedback (when available)

**Props:**
- `widget`: Widget instance
- `isActive`: Whether this is the active widget
- `onLongPress`: Callback when long-pressed
- `onTap`: Callback when tapped
- `position`: Rail position (for context)

### 4. **FeedArea.tsx**
Center content area displaying the active widget.

**Features:**
- Smooth transitions between widgets (fade)
- Type-specific rendering (feed, text, media)
- Loading state
- Empty state
- Responsive layout

**Props:**
- `activeWidget`: Currently displayed widget
- `isLoading`: Loading state

### 5. **widget-feed-screen.css**
Custom styles and animations for the widget feed UI.

**Includes:**
- Rail styling with glass effect
- Scrollbar hiding
- Transition animations
- Cosmic glow effect
- Haptic feedback visuals
- Responsive adjustments
- Mobile touch optimizations

---

## 📥 INSTALLATION

### Step 1: Copy Components

```bash
# Copy to your project
cp V1_UI_COMPONENTS/*.tsx /path/to/DREAMengin/components/
cp V1_UI_COMPONENTS/widget-feed-screen.css /path/to/DREAMengin/app/
```

### Step 2: Import CSS

Add to your `app/globals.css` or import in layout:

```css
@import './widget-feed-screen.css';
```

Or import directly in your layout component:

```typescript
// app/layout.tsx
import './widget-feed-screen.css'
```

### Step 3: Update Home Page

Replace your home page with the new widget feed screen:

```typescript
// app/home/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WidgetFeedScreen from '@/components/WidgetFeedScreen'

export default async function Home() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user's HOME widgets
  const { data: userWidgets } = await supabase
    .from('widget_instances')
    .select('*')
    .eq('user_id', user.id)
    .eq('space', 'home')
    .order('order')

  // Fetch following widgets
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = follows?.map(f => f.following_id) || []
  
  const { data: followingWidgets } = await supabase
    .from('widget_instances')
    .select(`
      *,
      profiles!inner(display_name, handle, avatar_url)
    `)
    .in('user_id', followingIds)
    .eq('space', 'profile')
    .in('visibility', ['public', 'followers'])
    .order('updated_at', { ascending: false })
    .limit(20)

  return (
    <WidgetFeedScreen
      initialUserWidgets={userWidgets || []}
      initialFollowingWidgets={followingWidgets || []}
      userId={user.id}
    />
  )
}
```

---

## 🎮 INTERACTION GUIDE

### For Users

**Scroll Rails:**
- Swipe up/down on left or right rail
- Browse available widgets
- Center area stays fixed

**Touch & Hold Icon (500ms):**
- Activates and loads that widget in center
- Visual feedback: icon scales and glows
- Haptic feedback vibration
- Use to preview/browse content

**Tap Icon (Quick Touch):**
- Opens post creation screen
- Context: posting to that widget
- Use for quick content creation

### For Developers

**Custom Events:**

The component dispatches a `createPost` event:

```typescript
// Listen for post creation requests
window.addEventListener('createPost', (e: CustomEvent) => {
  const { targetWidget } = e.detail
  // Navigate to post creation screen
  router.push(`/create?widget=${targetWidget.id}`)
})
```

**State Management:**

Access widget feed state:

```typescript
import { useState } from 'react'

// In your component
const [activeFeedWidget, setActiveFeedWidget] = useState<WidgetInstance | null>(null)
```

---

## 🎨 CUSTOMIZATION

### Colors

Edit `WidgetIcon.tsx` to customize widget type colors:

```typescript
const getWidgetColor = () => {
  switch (widget.type) {
    case 'text':
      return 'from-blue-500 to-blue-600'  // Change these
    case 'media':
      return 'from-purple-500 to-purple-600'
    // ...
  }
}
```

### Timing

Adjust interaction timing in `WidgetIcon.tsx`:

```typescript
const LONG_PRESS_DURATION = 500 // ms - Change for faster/slower long press
```

### Rail Width

Adjust rail width in `WidgetRail.tsx` and `widget-feed-screen.css`:

```typescript
// WidgetRail.tsx
style={{
  width: '80px',  // Change this
  minWidth: '80px',
}}
```

```css
/* widget-feed-screen.css */
@media (min-width: 768px) {
  .widget-rail {
    width: 100px !important;  /* Change this */
  }
}
```

### Transitions

Edit transition speed in `FeedArea.tsx`:

```typescript
className={`h-full transition-opacity duration-300 ...`}
//                                           ^^^ Change this
```

---

## 📱 MOBILE CONSIDERATIONS

### Touch Optimizations

The components include:
- Touch-action manipulation (prevents zoom)
- Tap highlight color removal
- Smooth momentum scrolling
- Haptic feedback (when available)

### Performance

- Rails use CSS `transform` for smooth animations
- Scrollbars hidden but functionality preserved
- Debounced refresh (30-second interval)
- Lazy rendering considerations

### Gestures

Supports:
- ✅ Vertical scrolling (rails)
- ✅ Long press (500ms)
- ✅ Tap
- ✅ Swipe (optional, for widget switching)
- ❌ Pinch zoom (disabled)
- ❌ Double-tap zoom (disabled)

---

## 🔧 TROUBLESHOOTING

### Icons Not Showing

Make sure you have `lucide-react` installed:

```bash
npm install lucide-react
```

### Haptic Feedback Not Working

Haptic feedback requires:
1. User gesture (tap/press)
2. HTTPS connection
3. Supported device
4. Browser support for `navigator.vibrate()`

### Transitions Janky

Try reducing animation complexity:

```typescript
// In FeedArea.tsx
className={`h-full transition-opacity duration-150 ...`}
//                                           ^^^ Faster
```

### Long Press Not Triggering

Check your timing constant:

```typescript
// In WidgetIcon.tsx
const LONG_PRESS_DURATION = 500 // Try 300ms for faster response
```

---

## 🧪 TESTING

### Manual Testing Checklist

- [ ] Rails scroll smoothly on mobile
- [ ] Long press (500ms) loads widget in center
- [ ] Tap navigates to post creation
- [ ] Active widget highlighted correctly
- [ ] Transitions smooth between widgets
- [ ] Empty states display properly
- [ ] Loading states work
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Desktop mouse interactions work

### Test on Multiple Devices

- iPhone (Safari)
- Android (Chrome)
- iPad (Safari)
- Desktop (Chrome, Firefox, Safari)

---

## 🎯 INTEGRATION WITH V1

### Works With

- ✅ Widget system (from widgets.ts)
- ✅ Space architecture (HOME/PROFILE)
- ✅ Feed widget
- ✅ Following system
- ✅ Post creation flow

### Replaces

- ❌ Traditional feed view (if you had one)
- ❌ Dashboard layout (if you had one)
- ❌ Global navigation chrome

### Keeps

- ✅ Profile pages (separate route)
- ✅ Settings (separate route)
- ✅ Onboarding flow
- ✅ Auth flow

---

## 📚 NEXT STEPS

### After Installing

1. Test on mobile device
2. Create default widgets for users
3. Implement post creation screen
4. Add pull-to-refresh (optional)
5. Add swipe gestures (optional)

### Future Enhancements

- Widget reordering (drag & drop)
- Rail customization per user
- Auto-advance timer option
- Widget preview on hover (desktop)
- Keyboard shortcuts (desktop)
- Accessibility improvements

---

## ✅ VERIFICATION

After installation, verify:

```bash
# Build succeeds
npm run build

# No TypeScript errors
npx tsc --noEmit

# Test in browser
npm run dev
# Visit http://localhost:3000/home
```

**Expected behavior:**
1. See left rail with your widgets
2. See right rail with following content
3. Feed widget active in center by default
4. Touch & hold icon → loads in center
5. Tap icon → triggers post creation event

---

## 🎉 SUCCESS CRITERIA

UI is successful if:

- [ ] Mobile-first, touch-friendly
- [ ] ONE widget visible at a time (focused)
- [ ] Rails scroll independently
- [ ] Long press feels natural
- [ ] Tap for creation is obvious
- [ ] No overwhelming information overload
- [ ] Smooth, performant on mobile
- [ ] Adapts well to desktop

---

**This is the V1 default UI. Mobile-first. Widget-centric. Focused. 📱✨**
