# Home Feed TV Spec

> **Single Source of Truth** — governs the layout and behaviour of the primary Home experience for signed-in users.
> Route: `/home` → `components/home/HomeSystem.tsx` (canonical component).

---

## 1. Layout Contract

| Property | Value |
|---|---|
| Scroll axis | **Vertical only** |
| Scroll behaviour | `scroll-snap-type: y mandatory` |
| Active items at once | **1** |
| Snap alignment | `scroll-snap-align: start` on each card |
| Overflow | `overflow-y: scroll` on the feed container |
| Bottom padding | `buttonSize (52px) + safeArea (env(safe-area-inset-bottom, 20px))` minimum |

## 2. Active-Item Rules

- Only the **active** (snapped) item animates or autoplays.
- All other items are **paused** (video: `pause()`, CSS animation: `animation-play-state: paused`).
- Autoplay is **suppressed** when `document.hidden === true`.
- Autoplay is **suppressed** when `prefers-reduced-motion: reduce` is active.

## 3. Channels

Six theme channels must be present and selectable from the Home header. Each channel filters the feed to cards of that theme. Channel definitions live in `lib/dreams/catalog.ts`.

| # | Channel | Identifier |
|---|---|---|
| 1 | Vibe | `vibe` |
| 2 | Focus | `focus` |
| 3 | Play | `play` |
| 4 | Create | `create` |
| 5 | Rest | `rest` |
| 6 | Connect | `connect` |

## 4. "DO NOT" Rules

- ❌ **Home is NOT a launcher grid.** `DreamsGrid` (tiny-tile pattern) MUST NOT appear in the primary Home flow.
- ❌ `DreamNavSurface` / `InnerNodes` / `OuterNodes` MUST NOT be imported into `app/home/page.tsx` or `HomeSystem.tsx`.
- ❌ No nav-mode controls rendered in the primary feed path.

## 5. Acceptance Criteria

- [ ] Feed container has `scroll-snap-type: y mandatory` applied.
- [ ] Exactly one card is animated/playing at any time.
- [ ] Autoplay pauses when `document.hidden`.
- [ ] Autoplay pauses under `prefers-reduced-motion: reduce`.
- [ ] All 6 channel tabs are present and functional.
- [ ] No `DreamsGrid` component import in `HomeSystem.tsx` primary path (CI tripwire enforces this).
- [ ] No `DreamNavSurface` / spatial nav imports in Home (CI tripwire enforces this).
- [ ] Bottom of feed is not clipped by the Golden Button (safe-area + button height padding applied).
