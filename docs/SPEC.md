# DREAMengin Repo Companion Spec

Status: active companion document  
Last updated: 2026-03-06

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
