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
| **auto** | 2026-03-14 03:00 UTC | `e8696bd` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #192 from appthemanger-ctrl/copilot/remove-dreamnav-homepage — Remove DreamNav from homepage render path; wire WorkspaceDashboard directly to runtime<br> |
| **auto** | 2026-03-14 00:04 UTC | `6cbfea9` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #188 from appthemanger-ctrl/copilot/replace-landing-page-animation — Replace 2D canvas HeroSprite with Babylon.js procedural 3D Dr. Eams on landing page<br> |
| **auto** | 2026-03-13 15:50 UTC | `048cca4` | copilot/create-pbr-texture-set-dr-eams | Copilot | ~3 modified<br>feat: Dr. Eams dark sci-fi landing page with PBR visuals and touch-reactive particles — - LandingHero: deep-space dark bg, scanline grid, cyan/yellow colour scheme,   dark-glass UI elements, 'DR EAMS / PBR·SCI-FI·V2' title block - HeroSprite: glowing split-colour ∞ symbol on helmet (yellow+cyan, pulsing),   PBR-themed particle burst on every touch/tap, cross-platform font stacks  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `components/HeroSprite.tsx`, `components/LandingHero.tsx`, `next-env.d.ts` |
| **auto** | 2026-03-13 15:17 UTC | `8d9a642` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #184 from appthemanger-ctrl/copilot/fix-pnpm-lockfile-error — fix: sync vitest version in package.json with pnpm-lock.yaml<br> |
| **auto** | 2026-03-13 08:37 UTC | `d909134` | completedream | appthemanger-ctrl | ~1 modified<br>Update platform description in README<br>✏️: `README.md` |
