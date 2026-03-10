# DREAMengin Docs Change Tracker

Status: active alignment ledger  
Last updated: 2026-03-06

This file is the working list for the README-first documentation pass. It exists to keep the alignment work explicit, traceable, and conservative.

## README-first rules

- `README.md` is the canonical product specification.
- `docs/` must describe the repo truthfully using README vocabulary.
- Legacy repo names are documented as implementation history, not as canonical product language.
- New docs content should prefer repurposing existing systems over inventing new top-level systems.

## Canonical naming decisions applied

| Legacy / mixed wording | Canonical wording |
|---|---|
| Home Space / home system | HomeDream |
| Profile Space / ProfileCanvas as product surface | EditProfileDream or ViewProfile depending on use |
| widgets as a top-level product term | Dreams |
| System menu / mixed menus | DreamMenu |
| messages / inbox as product module | DreamDM |
| shop | DreamShop |
| marketplace | DreamMarketplace |
| ads surface | DreamAds |
| `/api/dr-eams/*` as primary | `/api/ai/eams` is primary; legacy routes are support only |
| Dream Engine | DREAMengin |

## Docs updated in this pass

- `docs/ARCHITECTURE.md`
- `docs/FEATURE_STATUS.md`
- `docs/WIDGET_SYSTEM_V2.md`
- `docs/DR_EAMS.md`
- `docs/IDARI_CONTRACT.md`
- `docs/BOOGIEMAN_POLICY.md`
- `docs/THEME.md`
- `docs/SECURITY.md`
- `docs/SPEC.md`
- `docs/LAW.md`
- `docs/BUGS.md`
- `docs/HANDOFF.md`
- `docs/COPILOT_TOOLKIT.md`
- `docs/POLICY_TESTS.md`
- `docs/AXIOMS.md`
- `docs/alignment/REPO_TO_SPEC.md`
- `docs/engineering/guardrails.md`
- `docs/policy/theboogie.md`
- `docs/icons.md`
- `docs/ADD_WORKFLOW.md`

## Repo alignment items documented

### Routes
- `/homedream` is documented as the canonical HomeDream route.
- `/edit-profiledream` is documented as the canonical EditProfileDream route.
- `/view-profile` is documented as the canonical preview/share output route.
- `/profile/[handle]` remains the actual public profile destination in the current repo.
- `/home`, `/edit-profile`, and `/profile` are documented as support or legacy-facing routes.

### Dreams system
- `components/dreams/*` is documented as the canonical Dreams layer.
- `components/widgets/*` is documented as legacy implementation material being absorbed under Dreams naming.
- The 4-layer Dream model is documented as the repo target: DreamShell, Connector/Identity, Feature, Output/Projection.

### AI triad
- Dr. Eams → `/api/ai/eams`
- IDARi → `/api/ai/idari`
- TheBoogieMan.Ai → `/api/ai/boogieman`
- Legacy `app/api/dr-eams/*` routes are documented as support only.

### Privacy boundaries
- HomeDream remains the private source surface.
- EditProfileDream is the private builder.
- ViewProfile and public handle routes render only saved/shared output.
- Nothing public by default is now repeated across architecture, security, law, and feature docs.


## Code changes applied in this checkpoint

### Canonical route promotion
- `/homedream` now carries the real HomeDream implementation.
- `/home` now behaves as a legacy redirect into `/homedream`.
- `/edit-profiledream` now carries the real EditProfileDream implementation.
- `/edit-profile` now behaves as a legacy redirect into `/edit-profiledream`.

### EditProfileDream behavior cleanup
- Save state now distinguishes between unchanged and dirty state.
- The save button dims until there are unsaved changes.
- Successful save now returns the owner to `/view-profile`.
- Header copy now uses EditProfileDream / ViewProfile language.

### Primary route relabeling pass
- Key navigation, auth redirects, assistant actions, and settings links now point at `/homedream` and `/edit-profiledream` first.
- Brand-daydream profile actions now point at `/edit-profiledream` and `/view-profile`.
- Selected UI labels now use HomeDream, Edit ProfileDream, ViewProfile, DreamDM, and DreamMarketplace language.

## Remaining repo work after docs pass

- Continue renaming UI labels and route references to spec-first names.
- Continue repurposing legacy extras into spec-defined modules.
- Keep additions minimal and only where README requires missing architecture.
