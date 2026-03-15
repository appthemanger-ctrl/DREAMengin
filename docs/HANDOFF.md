# DREAMengin Handoff

Last updated: 2026-03-06

## What changed in this alignment pass

This handoff reflects the README-first documentation cleanup.

### Primary outcome
The docs now treat `README.md` as the authoritative full specification and use spec-first names across the implementation docs.

### Canonical names now documented first
- HomeDream
- EditProfileDream
- ViewProfile
- Dreams
- DreamShop
- DreamMarketplace
- DreamMenu
- DreamDM
- DreamAds
- Dr. Eams
- IDARi
- TheBoogieMan.Ai

## Current repo reality

- Canonical routes exist for `/homedream`, `/edit-profiledream`, and `/view-profile`.
- Legacy support routes still exist for `/home`, `/edit-profile`, `/profile`, and `/u/[handle]`.
- The public/shared profile destination in the current repo is still `/profile/[handle]`.
- The Dreams layer already exists in `components/dreams/*` while legacy widget material still exists in `components/widgets/*`.

## Next repo steps

1. Keep renaming UI labels and internal docs toward spec names.
2. Continue repurposing legacy extras into the spec instead of preserving them as separate product names.
3. Tighten HomeDream → EditProfileDream → ViewProfile projection boundaries in code.
4. Keep additions minimal and prefer moving or re-wiring what already exists.

## Tracking doc

Use `docs/alignment/DOCS_CHANGE_TRACKER.md` as the ledger for this pass.

## Change Timeline

| # | Date / Time (UTC) | Revision | Branch | Author | Summary |
|---|---|---|---|---|---|
| **auto** | 2026-03-15 05:48 UTC | `0d9bac8` | copilot/premium-phone-ui-improvements | Copilot | ~5 modified<br>fix: move premium CSS to correct file, address code review issues — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `app/globals.css`, `components/LandingHero.tsx`, `components/home/HomeDream.tsx`, `styles/globals.css`, `tailwind.config.ts` |
| **auto** | 2026-03-15 03:57 UTC | `d858bb8` | copilot/make-dream-bar-context-aware | Copilot | +2 added  ~1 modified<br>feat: make dream bar context-aware based on active route — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `lib/dreamdm/useDreamBarContext.ts`, `tests/dream-bar-context.test.ts`<br>✏️: `components/messaging/DreamDMBar.tsx` |
| **auto** | 2026-03-15 02:14 UTC | `1de7918` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #200 from appthemanger-ctrl/copilot/fix-drift-and-audit-codebase — fix: repair broken YAML in all 6 engin-* GitHub Actions workflows<br> |
| **auto** | 2026-03-15 00:14 UTC | `897501c` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #199 from appthemanger-ctrl/copilot/build-memory-layer-repo — feat: Build Memory Layer — persistent repo snapshot with drift-check CI gate<br> |
| **auto** | 2026-03-14 19:03 UTC | `b2942c5` | copilot/migrate-to-one-rate-limit-system | appthemanger-ctrl | no file changes<br>Merge branch 'completedream' into copilot/migrate-to-one-rate-limit-system<br> |
