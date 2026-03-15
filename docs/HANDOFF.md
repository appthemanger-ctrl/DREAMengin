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
| **auto** | 2026-03-15 13:15 UTC | `19ef1b5` | copilot/fix-gold-button-mobile-issues | Copilot | ~5 modified<br>Fix macOS dots, broken dual menus on mobile, Dr. Eams API body, widget icon — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `components/dreamengin/DrEamsPanel.tsx`, `components/home/HomeSystem.tsx`, `components/home/WorkspaceDashboard.tsx`, `components/menus/DualBottomMenu.tsx`, `components/widgets/WidgetCard.tsx` |
| **auto** | 2026-03-15 11:05 UTC | `96556eb` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #209 from appthemanger-ctrl/copilot/do-something-awesome — feat: wire notification system end-to-end + Dr. Eams→DreamDM context routing<br> |
| **auto** | 2026-03-15 10:04 UTC | `bf992a7` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #206 from appthemanger-ctrl/copilot/commit-auto-fix-lint — ci: introduce composite setup-node action; wire all Node-24 workflows; remove orphan commit steps<br> |
| **auto** | 2026-03-15 09:27 UTC | `e10c937` | copilot/commit-auto-fix-lint | Copilot | +1 added<br>ci: add PR template; confirm sync-build-memory targeted commit preserved — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `.github/PULL_REQUEST_TEMPLATE.md` |
| **auto** | 2026-03-15 09:13 UTC | `1447ca1` | copilot/create-pr-template | Copilot | +1 added<br>feat: add .github/pull_request_template.md for DREAMengin — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `.github/pull_request_template.md` |
