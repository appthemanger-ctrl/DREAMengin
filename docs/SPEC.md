# DREAMengin Design + System Spec

**Version:** 2.1  
**Status:** Active  
**Owner:** appthemanger-ctrl  
**Platform:** Next.js 16+ (App Router, TypeScript strict)  
**Last updated:** 2026-03-05

This is the single source of truth for DREAMengin's design system, UI behavior, and interaction model. Changes to the product must be reflected here.

---

## 1. Design Language: Frosted Glass OS

### 1.1 Core Principle
DREAMengin feels like a premium mobile OS — not a website, not a dark-gamer app. Think: iOS frosted glass, ice, sky, airy.

### 1.2 Color System
| Token | Value | Use |
|-------|-------|-----|
| `--de-accent` | `#2a8ab8` | Primary blue |
| `--de-gold` | `#c8981a` | System gold |
| `--de-heading` | `#0f2a5c` | High-contrast text |
| `--de-text` | `#1a3a6a` | Body text |
| `--de-text-dim` | `rgba(60,100,160,0.55)` | Secondary text |
| `--de-bg-start` | `#dce8f8` | Sky gradient top |
| `--de-bg-mid` | `#c5d8f0` | Sky gradient mid |
| `--de-bg-end` | `#b8ceec` | Sky gradient bottom |

### 1.3 Glass Recipe (single source)
```css
.de-surface {
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(160,195,240,0.45);
  box-shadow: 0 2px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7);
  border-radius: 24px;
}
```

### 1.4 Radius Family
All corners use one of: `6px, 10px, 14px, 18px, 24px, 32px, 9999px` (pill). Never freestyle.

### 1.5 Typography
- Font: Space Grotesk
- Headings: 700–800 weight, `--de-heading` color
- Body: 400–600 weight, `--de-text` color
- Labels/caps: 600–700, `letter-spacing: 0.06em`, uppercase

---

## 2. Component Anatomy

### 2.1 Widget Card
Every surface is a widget. Every widget has:
1. **Title Strip** — `de-widget-header`: title (uppercase caps), optional actions
2. **Content Area** — `de-widget-body`: the content
3. **Actions Row** — `de-widget-actions` (optional): pill buttons

### 2.2 Button
All buttons use `de-btn` base class. Variants: `de-btn-primary` (blue), `de-btn-gold`, `de-btn-ghost`. Always pill-shaped. Minimum 44px height.

### 2.3 Row
List items use `de-row` class. Thin `rgba(160,195,240,0.18)` dividers between rows.

### 2.4 Sheet (menus/modals)
Menus and modals use `de-sheet` class: `blur(32px)` + white-tinted glass + strong box shadow.

---

## 3. Navigation Model

### 3.1 Home Button
- One floating button: **Gold (System)** — right rail
- Drag vertically along the right rail
- **Locked single-tap** → opens Daydreams menu
- **Locked double-tap** → unlock (enter NAV Mode), snap to saved corner
- **Unlocked single-tap** → Go Home (reset anchor)
- **Unlocked double-tap** → open System menu
- Position persists via `localStorage` key `dreamengin:controls:v4`
- Lock state shows gold button with subtle blue ring

> **Note:** The two-button layout (blue + gold side by side) is reserved for daydream-specific controls only — for example, the Games daydream uses the dual-button layout as a game remote controller (see §10 Universal Mobile Remote).

### 3.2 Menus
- **Daydreams menu**: routes to all 7 Daydreams + Marketplace
- **System menu**: Dr.Eams, Settings, Account, Go Home, Appearance, All Dreams
- After menus open/close, button snaps back to saved corner

### 3.3 Edit Mode
- Enter via "Edit Layout" button in Home Dream
- Visual indicator: gold stripe at top + "EDIT MODE" badge + "Done" button
- Drag handles appear on widget title strips (only in edit mode)
- Edit gestures never compete with feed scroll
- Exit via "Done" button

### 3.4 Spatial Swipe Navigation
Spatial swipe gestures (swipe left/right to navigate between spaces) are currently **disabled**. Navigation between spaces happens via the Daydreams menu (single tap on the home button). This will be re-enabled in a future release.

---

## 4. Daydreams

All 7 Daydreams are fixed categories (not renamable). Users can add widgets to them.

| Daydream | Route | Focus |
|----------|-------|-------|
| Music Studio | `/daydream/music` | Label, releases, recorder, playlist |
| Media Vault | `/daydream/media-vault` | Private media library |
| Create | `/daydream/create` | Ideas, tasks, calendar, projects |
| Brand | `/daydream/brand` | Profile, social scheduling, analytics |
| Analytics | `/daydream/analytics` | Traffic, revenue, growth metrics |
| Games | `/daydream/games` | Game library, leaderboard, trending |
| Play | `/daydream/play` | Music + video player, queue |

Also accessible: Marketplace (`/marketplace`), Shop (`/shop`).

---

## 5. Widget System

### 5.1 Widget Library
Location: `components/widgets/WidgetLibrary.tsx`
- 12 curated widgets in 6 categories: Feed, Media, Social, Utilities, Work, Shop
- Each widget: icon, name, description, Add button, destination chooser

### 5.2 Widget Config
`ConfigureSheet.tsx` — supports toggle, text, select fields. Always: title, description, Save, Cancel, Reset.

### 5.3 Edit Mode
`EditModeProvider.tsx` — React context. `EditModeBanner.tsx` — visual indicator. `WidgetCard.tsx` — shows drag handle + options menu.

---

## 6. AI Triad

| Agent | Role | Audience | Location |
|-------|------|----------|----------|
| Dr. Eams | User assistant | Users | Home system, /home |
| IDARi | Optimization | Admins only | /admin |
| BoogieMan | Policy / Overwatch | Admins only | /admin |

All API keys are server-side Vercel env vars. Consensus gating: all 3 must approve major system updates.

---

## 7. Settings Structure

| Section | Path | Contents |
|---------|------|----------|
| Profile | `/edit-profile` | Name, handle, avatar, bio |
| Feed | `/settings/feed` → `/feed-settings` | Slices, preferences |
| Widgets | `/settings/widgets` | Pin, hide, reorder widgets |
| Theme | `/settings/appearance` | Gradient presets, upload, reset |
| Connectors | `/connectors` | IG, YouTube, Spotify, etc. |
| Controls | `/settings/controls` | Home button behaviors |
| Privacy | `/settings/privacy` | Visibility, blocking, appeals |
| Data | `/settings/data` | Export, Delete Data, Delete Account |
| Help | `/settings/help` | Wizard, guides, Dr.Eams |

---

## 8. Profile Model

- **Private editor** → `/profile` (authenticated, `profiles` table)
- **Public mirror** → `/profile/[handle]` and `/u/[handle]` (redirect)
- Saving private profile syncs public profile immediately
- Public profile shows ONLY published widgets and posts
- Connector data never leaks to public view

---

## 9. Anti-Patterns (Do Not Do)

- Do NOT use radial menus with dark overlays (use glass panels)
- Do NOT add neon, dark-gamer colors, random decoration
- Do NOT add full-screen blocking modals for onboarding
- Do NOT trigger edit mode by accident (drag during normal scroll)
- Do NOT route from Home Buttons (only: home/lock/menus)
- Do NOT show raw connectors on public profile
- Do NOT mix icon sets
- Do NOT freestyle radii (always use the radius family)
- Do NOT commit `.env` files or `node_modules`
- Do NOT delete documentation for features you did not complete yourself (see `docs/LAW.md §9.1`)
- Do NOT leave fixed bugs in `docs/BUGS.md` — delete the entry when the fix lands (see `docs/LAW.md §9.2`)

---

## 10. Universal Mobile Remote

See `docs/ARCHITECTURE.md §18` for the full dual-joystick design specification.

### 10.1 Core principle
Every game in the Games Daydream must be playable with two thumbs on a phone screen
using the Universal Mobile Remote layout. No physical keyboard or controller required.

### 10.2 Zoom prevention (required on all game pages)
```tsx
// In any Next.js game page — disable pinch-zoom
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
```
Also set `style={{ touchAction: 'none' }}` on the canvas element.

### 10.3 Joystick rendering
Draw the two thumbstick pads directly onto the game canvas (or as an overlay div):
- **Radius:** 44 px outer ring, 20 px inner nub.
- **Left pad center:** `(CANVAS_W * 0.14, CANVAS_H - 70)` — slightly inset from left edge.
- **Right pad center:** `(CANVAS_W * 0.86, CANVAS_H - 70)` — slightly inset from right edge.
- **Colours:** Left pad blue (`#2a8ab8`), right pad gold (`#c8981a`).
- **Opacity:** 0.45 at rest → 0.85 when a finger is detected within the pad zone.

### 10.4 Existing game (Dr. Eams) action mapping
| Right-stick direction | Dr. Eams action |
|---|---|
| Up | Jump / double-jump |
| Down | Duck |
| Left | Spin (activates with spin power-up) |
| Right | Shoot laser (activates with laser power-up) |
| Tap | Interact / examine |

### 10.5 PS5 Gamepad API
The Gamepad API is polled every animation frame via `navigator.getGamepads()`.
Dead-zone threshold: 0.25 on all axes.
See `docs/ARCHITECTURE.md §18.4` for the full button mapping.
