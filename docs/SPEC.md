# DREAMengin Repo Companion Spec

Status: active companion document  
Last updated: 2026-03-16

`README.md` is the canonical full system specification.

This file is not a replacement for that master spec. It exists only as a repo companion for implementation notes that are useful during alignment.

## 1. What this file is for

Use this file for:
- repo-local implementation notes
- route and component pointers
- design implementation reminders
- alignment notes that help engineers apply the README spec to the existing codebase

Do not use this file to override the README.

## 2. Canonical product names

### Product type
- DREAMengin is a **dual-runtime, spatial operating environment**

### Core surfaces
- HomeDream Surface (`HomeDream` in code)
- Edit ProfileDream Surface (`EditProfileDream` in code)
- View Profile Surface (`ViewProfile` in code)

### Runtime regions
- Surface Space (upper active runtime region)
- DreamSpace (lower modular runtime region)
- DreamDM Bar / Runtime Seam (boundary between the two regions)

### Daydream Surface Network
- Music Daydream Surface
- Games Daydream Surface
- Lab Daydream Surface
- Code Daydream Surface
- Brand Daydream Surface
- Create Daydream Surface

### Engin runtimes
- StarMakerEngin
- GameEngin
- LabEngin
- CodeEngin
- BrandingEngin
- ContentEngin

### Platform modules
- DreamShop Surface
- DreamMarketplace Surface
- DreamMenu
- DreamDM Surface
- DreamAds Surface
- Dream Windows (modular runtime containers)

### AI triad
- Dr. Eams
- IDARi
- TheBoogieMan.Ai

## 3. Canonical route intent

- `/homedream` = HomeDream Surface
- `/edit-profiledream` = Edit ProfileDream Surface
- `/view-profile` = View Profile Surface preview/share entry
- `/profile/[handle]` = current public/shared profile destination in the repo
- `/shop` = DreamShop Surface
- `/marketplace` = DreamMarketplace Surface
- `/messages` = DreamDM Surface
- `/ads` = DreamAds Surface

## 4. Universal Dream Window rule

All modular runtime containers are Dream Windows in the product model.

Use the four-layer Dream Window language first:
1. DreamShell
2. Connector/Identity
3. Feature
4. Output/Projection

Dream Window states: Unbound → Bound → Mounted → Collapsed

## 5. Privacy rule

Nothing becomes public without explicit user intent. Public/shared surfaces should render saved output, not unrestricted private source state.

## 6. Design rule

Use gold, light blue, and white as the primary semantic design language with restrained motion and a premium mobile-first feel.

## 7. OS-layer language rules

When writing docs, comments, or UI strings:
- Say **surface**, not page
- Say **Dream Window**, not widget or card
- Say **runtime**, not app
- Say **runtime environment**, not platform (when describing the whole system)
- Say **DreamSpace**, not widget layer
- Say **surface switching**, not tab navigation
- Say **bind / mount / activate**, not link widget / open page / launch card

`README.md` is the canonical full system specification.

This file is not a replacement for that master spec. It exists only as a repo companion for implementation notes that are useful during alignment.

## 1. What this file is for

Use this file for:
- repo-local implementation notes
- route and component pointers
- design implementation reminders
- alignment notes that help engineers apply the README spec to the existing codebase

Do not use this file to override the README.

## 2. Canonical product names

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

## 3. Canonical route intent

- `/homedream` = HomeDream
- `/edit-profiledream` = EditProfileDream
- `/view-profile` = ViewProfile preview/share entry
- `/profile/[handle]` = current public/shared profile destination in the repo
- `/shop` = DreamShop
- `/marketplace` = DreamMarketplace
- `/messages` = DreamDM
- `/ads` = DreamAds

## 4. Universal Dreams rule

All widgets are Dreams in the product model.

Use the four-layer Dream language first:
1. DreamShell
2. Connector/Identity
3. Feature
4. Output/Projection

## 5. Privacy rule

Nothing becomes public without explicit user intent. Public/shared surfaces should render saved output, not unrestricted private source state.

## 6. Design rule

Use gold, light blue, and white as the primary semantic design language with restrained motion and a premium mobile-first feel.
