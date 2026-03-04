# Dream Engine — Doc-Derived Constraints (Source of Truth)

## Coherence rule (primary)
- Everything must fit coherently together across routes, components, rendering behavior, data flow, assets, and tests.
- If docs, tests, and implementation disagree, resolve the mismatch so they converge on one coherent source of truth.

Derived from:
- `./ARCHITECTURE.md`
- `./ROUTES_PRIMARY.md`
- `./PRIMARY_FLOW.md`
- `./HOME_FEED_TV_SPEC.md`

## Routing patterns
- Primary signed-in home route is `/home` and must use `HomeSystem` as the canonical component.
- Menu and Home linking must target only Primary routes; Lab routes stay unlinked from Home/menu.
- Keep global `/policy` link always reachable.

## Rendering loop guidance
- Home feed is vertical scroll-snap (`scroll-snap-type: y mandatory`) with one active card at a time.
- Only active card may animate/autoplay; non-active cards must be paused.
- Autoplay must pause when page is hidden or when reduced-motion is requested.

## Performance budgets / battery constraints
- Rendering should be demand-driven and battery-aware (iOS-first constraints).
- Avoid unnecessary continuous animation in non-active items.
- Preserve safe-area bottom padding so controls do not clip feed content.

## Asset pipeline rules
- Branding assets currently resolve from public image paths used by runtime code:
  - `/images/logo1.PNG`
  - `/images/logo2.PNG`
  - `/images/logo3.PNG`
- Tests and docs must match runtime asset paths/casing exactly.

## Supabase patterns
- Supabase remains the system of record for auth/data/storage.
- Prefer server fetch paths for sensitive reads/writes; validate writes and rely on RLS.

## Explicit do / don’t
- Do keep Home changes in canonical ownership files (`app/home/page.tsx`, `components/home/HomeSystem.tsx` and feed components called by it).
- Do not reintroduce launcher-grid Home behavior in the primary path.
- Do not import spatial nav surfaces into primary Home path.
