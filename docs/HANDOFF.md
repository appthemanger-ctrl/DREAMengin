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
| **auto** | 2026-03-13 05:44 UTC | `0acaa21` | codex/redesign-dream-bar-and-layout-features | appthemanger-ctrl | ~5 modified<br>Refine DreamDM bar runtime flow and home feed layout<br>✏️: `components/LandingHero.tsx`, `components/home/HomeSystem.tsx`, `components/home/WorkspaceDashboard.tsx`, `components/messaging/DreamDMBar.tsx`, `components/runtime/DualRuntimeContainer.tsx` |
| **auto** | 2026-03-12 05:35 UTC | `d331ed7` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #179 from appthemanger-ctrl/copilot/create-dreams-space-runtime — YouTube connector + Dreams Space runtime in DreamDM bar<br> |
| **auto** | 2026-03-11 19:06 UTC | `98d0122` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #176 from appthemanger-ctrl/claude/update-gold-button-attachment-rule — Implement corrected Gold Button attachment spec and dual runtime system<br> |
| **auto** | 2026-03-11 15:24 UTC | `9e455cd` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #171 from appthemanger-ctrl/claude/fix-landing-page-issues — Fix landing page branding, stats, and metadata<br> |
| **auto** | 2026-03-11 14:34 UTC | `92e7461` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #169 from appthemanger-ctrl/copilot/add-quantum-portfolio-optimizer — feat: 6 Daydream CI workflows, GamesHub component, and GameEngin Bug Patrol action<br> |
