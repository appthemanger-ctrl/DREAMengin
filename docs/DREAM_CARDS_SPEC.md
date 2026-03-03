# Dream Cards Spec

> **Single Source of Truth** — minimum size, layout and content requirements for Dream destination cards rendered inside the TV feed.

---

## 1. Why "Premium"

Dreams are large **destinations**, not small app icons. Each card occupies the full viewport height and invites exploration. Space, hierarchy, and a single focal surface are what distinguish DREAMengin from a generic launcher grid.

## 2. Minimum Dimensions

| Token | Value | Notes |
|---|---|---|
| `DREAM_CARD_MIN_HEIGHT` | `100dvh` | Full viewport height per card |
| `DREAM_CARD_MIN_WIDTH` | `100%` | Full container width |
| `DREAM_CARD_INNER_PADDING` | `24px` | Horizontal content padding |
| `DREAM_CARD_MEDIA_MIN_HEIGHT` | `40dvh` | Media/hero area minimum |
| `DREAM_CARD_TAP_TARGET` | `44px` | Minimum tap-target on any interactive element |

## 3. Required Content Surfaces

Each Dream card **must** include:

1. **Hero media** — video or high-quality image (min 40dvh height).
2. **Title** — legible at 20pt+, high-contrast against background.
3. **Short description** — 1–3 lines of context.
4. **Primary action** — at least one CTA button (e.g., "Enter", "Explore").
5. **Channel badge** — one of the 6 theme channels (see `HOME_FEED_TV_SPEC.md §3`).

## 4. Animation Rules

- Only the **active** (snapped) card plays its hero media.
- Entry animation is a **fade + subtle scale-up** (≤ 300 ms).
- No animation fires under `prefers-reduced-motion: reduce`.
- No `filter: blur` or heavy `backdrop-filter` applied while the feed is scrolling (performance requirement).

## 5. "DO NOT" Rules

- ❌ No tiny tile / icon grid inside a Dream card.
- ❌ No `setTimeout → connected` fake status indicators.
- ❌ No hard-coded "built by …" attribution visible to users.
- ❌ Connector status claims must be truthful (no simulated "connected" state).

## 6. Acceptance Criteria

- [ ] Each card fills `100dvh` vertically.
- [ ] Hero media area is ≥ `40dvh`.
- [ ] Title font size ≥ 20px.
- [ ] At least one primary CTA is present per card.
- [ ] Channel badge is present per card.
- [ ] No autoplay on non-active cards.
- [ ] No animation under `prefers-reduced-motion`.
- [ ] No fake connector status (no `setTimeout → connected` pattern).
- [ ] Cards are not tiny icons — snapshot tests guard minimum height.
