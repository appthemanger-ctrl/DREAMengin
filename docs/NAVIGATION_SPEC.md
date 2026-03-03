# Navigation Spec

> **Single Source of Truth** — governs all navigation behaviour including the Golden Button, menus, and what is explicitly disabled.

---

## 1. Golden Button

The Golden Button is the **only** primary navigation affordance. It is a persistent floating overlay that appears on every screen.

| Gesture | Action |
|---|---|
| **Tap** | Navigate to `/home` (reset to Home feed) |
| **Hold** | Open the radial menu |

### Mounting Rules

- The Golden Button / `DreamNavControls` is mounted **once**, inside `HomeSystem.tsx` (the canonical primary component).
- It must **not** be mounted in `app/layout.tsx`, `app/home/page.tsx`, or any other page component.
- CI tripwire `scripts/check-golden-mount.mjs` enforces the single-mount rule.

## 2. Spatial Navigation — DISABLED

- **Nav mode / spatial navigation is permanently disabled** in the primary user flow.
- `DreamNavControls` internal nav-mode state is NOT exposed to the user.
- No UI toggle for nav mode exists in Settings (or it is clearly marked **Lab only**).
- The string `"NAV MODE"` / `"nav mode"` must not appear in user-facing components or pages outside the lab. CI tripwire `scripts/check-navmode-strings.mjs` enforces this.

## 3. Menu (Radial / System)

- Menu opens on **hold** of the Golden Button.
- Menu contains only **primary routes** (see `ROUTES_PRIMARY.md`).
- Lab routes are **not linked** from the menu.
- Menu auto-closes after the user selects an action.
- Menu does not mount in multiple places.

## 4. Overlay Mounting

- The overlay host (Golden Button + menus) lives inside `HomeSystem.tsx`.
- It is positioned `fixed` with correct `z-index` so it is never clipped by `overflow: hidden` ancestors.
- `pointer-events: none` is set on any purely decorative overlay wrapper; interactive elements restore `pointer-events: auto`.
- iOS safe-area insets (`env(safe-area-inset-bottom)`) are applied to the button position.

## 5. "DO NOT" Rules

- ❌ Do NOT re-enable nav mode or spatial navigation.
- ❌ Do NOT mount `DreamNavSurface` in the primary flow.
- ❌ Do NOT mount `DreamNavControls` in more than one top-level component.
- ❌ Do NOT link lab routes from Home or the menu.

## 6. Onboarding Reference

- Onboarding screens reference the **Golden Button** as the navigation affordance.
- Onboarding does NOT mention spatial navigation or nav mode.

## 7. Acceptance Criteria

- [ ] Tap Golden Button → navigates to `/home`.
- [ ] Hold Golden Button → opens radial menu.
- [ ] Menu contains only primary routes.
- [ ] No nav-mode toggle visible to users (outside Lab).
- [ ] Golden Button present on every screen (persists across route changes).
- [ ] Golden Button mounted in exactly one place (CI tripwire enforces).
- [ ] No `"NAV MODE"` string in user-facing files (CI tripwire enforces).
- [ ] `DreamNavSurface` not imported in Home primary path (CI tripwire enforces).
- [ ] Safe-area inset applied to button bottom position.
- [ ] `z-index` layering correct; overlay not clipped by `overflow: hidden`.
