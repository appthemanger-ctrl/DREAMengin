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
| **auto** | 2026-03-11 14:16 UTC | `5f59112` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #168 from appthemanger-ctrl/copilot/update-portfolio-optimizer — Rename Portfolio Optimizer → Optimizero; add quantum circuit canvas visualization with touch optimization<br> |
| **auto** | 2026-03-11 14:14 UTC | `4a663ba` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #166 from appthemanger-ctrl/copilot/run-portfolio-optimizer — feat: replace landing page video bg with live Portfolio Optimization canvas animation<br> |
| **auto** | 2026-03-11 14:13 UTC | `0e8c70d` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #164 from appthemanger-ctrl/copilot/run-quantum-portfolio-optimizer — feat: 20-game GameEngin, GamesHub wiring, Babylon 3D hub, AI prompt upgrades<br> |
| **auto** | 2026-03-11 13:52 UTC | `89a5aa5` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #165 from appthemanger-ctrl/copilot/add-ai-adaptation-for-spec-requirements — feat(idari): add portfolio-optimizer–style spec-check + Vercel build verification to daily cycle<br> |
| **auto** | 2026-03-11 13:23 UTC | `4f4aec0` | completedream | appthemanger-ctrl | ~1 modified<br>Delete Repo Guard workflow from GitHub Actions — Removed the Repo Guard workflow that blocks certain files from being committed.<br>✏️: `.github/workflows/bouncer.yml` |
