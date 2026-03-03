# Primary Flow

> One-page overview of the core user journey from landing to home.

---

## Core Flow

```
/ (Landing — LandingHero, unauthenticated)
  │
  ▼
/join (Sign-up) ── or ── /login (Sign-in)
  │
  ▼
/onboarding (New-user setup — references Golden Button, not spatial nav)
  │
  ▼
/home (Canonical Home — HomeSystem, TV feed, scroll-snap vertical)
  │
  ├── Golden Button (tap → /home, hold → radial menu)
  │     └── Menu → Settings / Profile / Discover / Connectors / …
  │
  └── TV Feed (6 channel tabs, one active card at a time)
        └── Dream Card (full-viewport, hero media, primary CTA)
```

---

## File Ownership

| Concern | File |
|---|---|
| Root entry (unauthenticated) | `app/page.tsx` → `LandingHero` |
| Authenticated Home entry | `app/home/page.tsx` → `HomeSystem` |
| **Canonical Home component** | `components/home/HomeSystem.tsx` ← **PRIMARY** |
| Global overlay mount point | `HomeSystem.tsx` (Golden Button lives here) |
| Root layout (policy footer) | `app/layout.tsx` |
| Onboarding | `app/onboarding/` |

---

## Back Behaviour (Safari iOS)

- Swipe-back from any route navigates to the previous route.
- The Golden Button is always visible; tapping it is the reliable "go home" gesture.
- Do not rely on browser back for Home navigation — use the Golden Button.

---

## Implementer Notes (Plan A scope)

When modifying the Home experience, touch **only**:

1. `components/home/HomeSystem.tsx` — canonical Home component
2. `components/home/UniversalFeed.tsx` — feed content (replace grid with DreamCardLarge rows)
3. `app/home/page.tsx` — server wrapper (minimal changes only)

Do **not** create new top-level page components for Home. Do **not** re-mount the overlay in `app/layout.tsx`.

### Components to "Dead-End" (not deleted, not used in primary path)

| Component | Reason |
|---|---|
| `components/home/DreamsGrid.tsx` | Tiny-tile launcher grid — replaced by DreamCardLarge rows |
| `components/dreamnav/HomeFeedWidgetGrid.tsx` | Widget grid — lab use only |
| `components/dreamnav/DreamNavControls.tsx` | Keep for Golden Button; remove nav-mode surface exposure |
