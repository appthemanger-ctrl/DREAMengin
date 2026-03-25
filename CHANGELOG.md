# DREAMengin Changelog

All notable changes to DREAMengin are documented in this file.

---

## [2.0.0] — 2026-03-25

**"One Product"** — DREAMengin v2.0.0 closes all multi-generation structural partials and ships as a single coherent runtime environment.

### What v2.0.0 means

1. **Canonical naming wins** — Every surface, route, component, and doc now uses the single authority defined in `lib/identity/canonical-names.ts` and `docs/NAMING_AUTHORITY.md`. Widget-era naming is fully archived. Dream Window is the only term for modular runtime containers.

2. **HomeDream is the clear product center** — `/homedream` is the authenticated runtime root. Gold Button + DreamDM Bar + dual runtime persistence make the hierarchy obvious and preserve context on every surface transition.

3. **v1-ui layer fully subordinated** — `components/v1-ui/` is now a read-only legacy archive. The v1 widget-feed-screen CSS is no longer imported globally or by HomeDream. Dream Rail (v2) CSS lives in `styles/home-dream.css` with canonical class names (`dream-rail`, `dream-rail-icon`, `dream-feed-transition`).

4. **Dreams / Daydreams / Engins are legible** — The product model is documented in `docs/PRODUCT_DEFINITION.md`. The 6 Daydream Surfaces, 6 Engin runtimes, and 11 connection paths are all live and named consistently in UI and code.

5. **Auth + onboarding + entry are boring and reliable** — The `/join` → `/auth/callback` → `/homedream` path is clean. Open-redirect guard enforced on the auth callback. All OAuth provider flows (Google, GitHub) go through the same path.

6. **Core repo partials closed**:
   - SuperDreamWidget composition: real cluster rules active (StarMaker, GameSphere, BrandDream, LabCode, ContentStream).
   - AI triad coordination bus: `lib/agents/agentBus.ts` client bridge + `runTriadConsensus` server gate both active.
   - Clutter pass: v1-ui CSS removed from global layout.
   - Motion restraint: GodTier blur 0.15/0.10, GlowLayer kernel 16.
   - Profile/public boundary: `visibility_mappings` is the single authoritative gate; ViewProfile reads only projections.

### Changed

- `package.json` — version `1.0.0` → `2.0.0`
- `lib/identity/canonical-names.ts` — added `PRODUCT_VERSION = '2.0.0'` constant
- `app/layout.tsx` — removed global `@/components/v1-ui/widget-feed-screen.css` import
- `components/home/HomeDream.tsx` — removed `@/components/v1-ui/widget-feed-screen.css` import; renamed `widget-rail` → `dream-rail`, `widget-rail-right` → `dream-rail-right`, `widget-icon` → `dream-rail-icon`, `feed-area-transition` → `dream-feed-transition`; updated aria-labels from "Your widgets" → "Your Dream Windows"
- `styles/home-dream.css` — added v2 Dream Rail CSS classes
- `docs/FEATURE_STATUS.md` — updated to v2.0.0; closed all 🟡 partial items; added v2.0.0 checklist section

### Architecture

- Dream Rail CSS is now owned by the HomeDream Surface (`styles/home-dream.css`), not the archived v1-ui layer.
- `components/v1-ui/` remains in the repository as a read-only archive. Its components are not imported by any active surface.

---

## [1.0.0] — 2026-03-24

Phase 8 completion — all 100 points of the Real Runtime Completion spec delivered.

See `docs/dreamengin_phase8.md` for the full 100-point specification.
