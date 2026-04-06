# DREAMengin Changelog

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


All notable changes to DREAMengin are documented in this file.

---

## [2.0.0] — 2026-03-25

**"One Product"** — DREAMengin v2.0.0 closes all multi-generation structural partials and ships as a single coherent runtime environment.

### What v2.0.0 means

1. **Canonical naming wins** — Every surface, route, component, and doc now uses the single authority defined in `lib/identity/canonical-names.ts` and `docs/NAMING_AUTHORITY.md`. Widget-era naming is fully archived. Dream Window is the only term for modular runtime containers.

2. **HomeDream is the clear product center** — `/homedream` is the authenticated runtime root. All competing shell routes (`/dreamengin`, etc.) now redirect to `/homedream`. Gold Button + DreamDM Bar + dual runtime persistence make the hierarchy obvious.

3. **Parallel old/new UI layers stop competing** — `components/v1-ui/` is archived. Competing Babylon orbit shell (`/dreamengin`) is redirected. `components/DashboardLayout*`, `NavBar*`, `HomeDashboard` all carry archive headers. v1-era CSS subordinated.

4. **Dreams / Daydreams / Engins are legible** — `/codespace` → `/daydream/code`. `/physics-lab` → `/daydream/lab`. `/music` routing fixed in DreamDMBar. Surface names in HomeDream quick-actions corrected to canonical terms.

5. **Auth + onboarding + entry are boring and reliable** — New users from `/join` go to `/onboarding` (not directly to `/homedream`). OAuth from `/join` sets `?next=/onboarding` on the auth callback. Returning users go straight to `/homedream`.

6. **Core repo partials closed** — Build enforcement (`lib/adari.ts`, `scripts/postbuild.js`) updated from v1-era files to v2.0.0 canonical required files. DreamDMBar routing fully aligned to canonical Daydream routes. `PRODUCT_VERSION = '2.0.0'` in canonical-names.

### Changed

- `package.json` — version `1.0.0` → `2.0.0`
- `lib/identity/canonical-names.ts` — added `PRODUCT_VERSION = '2.0.0'` constant
- `app/layout.tsx` — removed global `@/components/v1-ui/widget-feed-screen.css` import
- `components/home/HomeDream.tsx` — removed v1-ui CSS import; renamed `widget-rail` → `dream-rail`, `widget-icon` → `dream-rail-icon`, `feed-area-transition` → `dream-feed-transition`; aria-labels updated
- `styles/home-dream.css` — added v2 Dream Rail CSS classes
- `app/dreamengin/page.tsx` — was Babylon orbit shell; now `redirect('/homedream')`
- `app/codespace/page.tsx` — was CodeSpace IDE; now `redirect('/daydream/code')`
- `app/physics-lab/page.tsx` — was PhysicsLab; now `redirect('/daydream/lab')`
- `app/join/page.tsx` — email signup redirects to `/onboarding`; OAuth sets `?next=/onboarding` on callback
- `components/messaging/DreamDMBar.tsx` — `dreams` surface routes to `toggleDrEams()` (not `/dreamengin`); `code` → `/daydream/code`; `music` → `/daydream/music`
- `components/home/WorkspaceDashboard.tsx` — quick-action pills: "DreamProfile" → "Edit ProfileDream", "Feed" → "Discover", "Your Dreams" → "View Profile"
- `lib/adari.ts` — REQUIRED_PATHS updated to v2 canonical files; version check added
- `scripts/postbuild.js` — same
- `docs/FEATURE_STATUS.md` — all partial items closed; v2.0.0 checklist added
- `tests/v2-readiness.test.ts` — 31 structural invariant tests

### Archived (preserved for reference, archive header added)

- `components/DashboardLayout.tsx`, `DashboardLayout-enhanced.tsx`
- `components/NavBar.tsx`, `NavBar-enhanced.tsx`
- `components/HomeDashboard.tsx`
- `components/MobileFeedCard.tsx`, `MobileNavBarEnhanced.tsx`
- `components/FeedCard-enhanced.tsx`
- `components/AIAssistant-voice-enhanced.tsx`, `AIAssistantEnhanced.tsx`
- `components/CollaborativeCanvas.tsx`, `ContentScheduler.tsx`
- `components/v1-ui/` — CSS no longer globally imported

---

## [1.0.0] — 2026-03-24

Phase 8 completion — all 100 points of the Real Runtime Completion spec delivered.

See `docs/dreamengin_phase8.md` for the full 100-point specification.
