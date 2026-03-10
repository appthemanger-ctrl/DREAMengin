# DREAMengin Open Alignment Gaps

Last updated: 2026-03-10

This file tracks known gaps using README-first naming.

## Core surfaces

| Area | Status | Current gap |
|---|---|---|
| HomeDream | 🟡 | Legacy `/home` and mixed Home Space naming still appear beside canonical HomeDream language. |
| EditProfileDream | 🟡 | Builder exists, but owner profile workspace and builder naming are still partially mixed. |
| ViewProfile | 🟡 | Public output exists, but preview/share terminology is not yet fully consistent. |

## Dreams

| Area | Status | Current gap |
|---|---|---|
| Dreams naming | 🟡 | Legacy widget naming still appears in components, docs, and some code paths. |
| Source vs projection | 🟡 | DreamOutputLayer exists, but docs and product copy still need stricter saved-projection wording. |
| Super Widget rules | 🟡 | Combined Dream output exists conceptually and partly in code, but compatibility rules still need full cleanup. |

## Daydream model

| Area | Status | Current gap |
|---|---|---|
| Canonical six pairs | 🟡 | Six canonical Side A routes exist, but extra daydream routes remain in the repo. |
| GameEngin component | ✅ | `components/daydream/GameEngin.tsx` created in Phase 6. |
| useDaydreamState hook | ✅ | `lib/daydream/useDaydreamState.ts` created in Phase 6. |
| DaydreamShell sideBComponent | ✅ | `DaydreamShell` now accepts `sideBComponent` prop; `GameEngin` wired into Games Daydream page. |
| Engin naming | 🟡 | Some Engin-side behavior exists in components rather than clearly named Engin surfaces. |

## Platform modules

| Area | Status | Current gap |
|---|---|---|
| DreamMenu | 🟡 | Menus exist across multiple folders with mixed names. |
| DreamAds | 🟡 | Ads surface exists, but user DreamAds vs platform promotions still need clearer boundary language. |

## AI triad

| Area | Status | Current gap |
|---|---|---|
| Dr. Eams routing | 🟡 | Canonical `/api/ai/eams` exists, but legacy `/api/dr-eams/*` routes remain. HomeDream search bar integration is unimplemented. Phase 6 item. |
| Dr. Eams send-to-DreamDM | 🟡 | Dr. Eams must launch DreamDM when user presses send in HomeDream. Phase 6 item. |
| IDARi exposure rules | 🟡 | Admin-only model is documented but IDARi guard under dev bypass is unverified. Phase 6 item. |
| TheBoogieMan.Ai privacy logging | 🟡 | TheBoogieMan must log privacy-adjacent events (visibility changes, profile publication). Phase 6 item. |
| AI Triad consensus gate | 🟡 | Unanimous triad approval for major updates is not yet enforced. Phase 6 item. |

## Privacy system

| Area | Status | Current gap |
|---|---|---|
| visibility_mappings consultation | 🟡 | ViewProfile and public profile routes must consult the `visibility_mappings` table before rendering; this is not yet enforced. Phase 6 item. |
| Private-save vs explicit-share | 🟡 | EditProfileDream has a save flow but does not distinguish between local private save and explicit public share. Phase 6 item. |
| Real capability audit | 🟡 | No systematic audit has been done to confirm all visible actions map to real system calls. Phase 6 item. |
