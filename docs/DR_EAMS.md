# Dr. Eams

Status: active triad surface  
Last updated: 2026-03-06

Dr. Eams is the user-facing assistant in DREAMengin.

`README.md` defines Dr. Eams as:
- a primary assistant presence in DreamMenu
- a HomeDream search and guidance surface
- a message-launch surface that routes users into DreamDM when they send a message

## Canonical route

- Primary route: `POST /api/ai/eams`

## Legacy support routes still in the repo

- `app/api/dr-eams/*`

These legacy routes should be treated as support material, not the canonical product-facing path.

## Product role

Dr. Eams must remain:
- useful
- context-sensitive
- non-intrusive
- aligned to real system actions only

Dr. Eams must not:
- imply actions that do not exist
- bypass privacy rules
- bypass visibility rules
- create public output without explicit user intent

## Surface placement

### HomeDream
Dr. Eams acts as:
- search
- guidance
- destination suggestion
- message launcher

### DreamMenu
Dr. Eams appears as a system guide and helper.

### DreamDM
When the user is composing a real message through the Dr. Eams flow, the action should land in DreamDM rather than pretending the message was sent somewhere else.

## Vocabulary rules

Use README-first product vocabulary:
- HomeDream
- EditProfileDream
- ViewProfile
- Dreams
- DreamMenu
- DreamDM
- DreamShop
- DreamMarketplace
- DreamAds

Avoid reviving old mixed language when a canonical term exists.

## Capability notes

Dr. Eams capability metadata is defined in:
- `dr-eams/capabilities.yaml`
- `dr-eams/tools.ts`

## Honest implementation status

The repo contains both canonical and legacy Dr. Eams routing. Documentation and code should continue to prefer `/api/ai/eams` while legacy support routes are absorbed or retired.
