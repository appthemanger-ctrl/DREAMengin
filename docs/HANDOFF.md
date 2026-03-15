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
| **auto** | 2026-03-15 09:27 UTC | `e10c937` | copilot/commit-auto-fix-lint | Copilot | +1 added<br>ci: add PR template; confirm sync-build-memory targeted commit preserved — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `.github/PULL_REQUEST_TEMPLATE.md` |
| **auto** | 2026-03-15 08:17 UTC | `03efb24` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #205 from appthemanger-ctrl/copilot/check-actions-for-node-updates — chore: upgrade GitHub Actions to Node.js 24-compatible versions<br> |
| **auto** | 2026-03-15 08:17 UTC | `ebc5feb` | copilot/check-actions-for-node-updates | appthemanger-ctrl | no file changes<br>Merge branch 'completedream' into copilot/check-actions-for-node-updates<br> |
| **auto** | 2026-03-15 08:15 UTC | `463884d` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #204 from appthemanger-ctrl/copilot/premium-phone-ui-improvements — feat: light blue/gold/white precision UI with 3D platform identity preserved<br> |
| **auto** | 2026-03-15 05:48 UTC | `0d9bac8` | copilot/premium-phone-ui-improvements | Copilot | ~5 modified<br>fix: move premium CSS to correct file, address code review issues — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `app/globals.css`, `components/LandingHero.tsx`, `components/home/HomeDream.tsx`, `styles/globals.css`, `tailwind.config.ts` |
