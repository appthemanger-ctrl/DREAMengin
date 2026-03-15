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
| **auto** | 2026-03-15 20:25 UTC | `a547bd5` | completedream | appthemanger-ctrl | ~1 modified<br>Update README.md<br>✏️: `README.md` |
| **auto** | 2026-03-15 16:14 UTC | `91184b6` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #213 from appthemanger-ctrl/copilot/fix-codebase-issues — fix: resolve 5 critical issues blocking build, lint, CI, and drafts runtime<br> |
| **auto** | 2026-03-15 14:01 UTC | `43caab4` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #211 from appthemanger-ctrl/copilot/fix-gold-button-mobile-issues — Fix macOS dots, broken dual menus on mobile, Dr. Eams API body, widget icon<br> |
| **auto** | 2026-03-15 13:15 UTC | `19ef1b5` | copilot/fix-gold-button-mobile-issues | Copilot | ~5 modified<br>Fix macOS dots, broken dual menus on mobile, Dr. Eams API body, widget icon — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `components/dreamengin/DrEamsPanel.tsx`, `components/home/HomeSystem.tsx`, `components/home/WorkspaceDashboard.tsx`, `components/menus/DualBottomMenu.tsx`, `components/widgets/WidgetCard.tsx` |
| **auto** | 2026-03-15 11:05 UTC | `96556eb` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #209 from appthemanger-ctrl/copilot/do-something-awesome — feat: wire notification system end-to-end + Dr. Eams→DreamDM context routing<br> |
