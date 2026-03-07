# IDARi Contract

Status: active internal contract  
Last updated: 2026-03-06

IDARi is the admin-only internal operator in the DREAMengin AI triad.

## Canonical route

- `POST /api/ai/idari`

## Product role

IDARi exists for internal system work such as:
- repo maintenance support
- structured bug analysis
- optimization planning
- compression or cleanup planning
- internal improvement assistance

IDARi is not a standard end-user assistant and must not be exposed through normal user-facing UI.

## Access rules

- admin-only
- server-side only
- must remain guarded even when dev bypass tools exist elsewhere in the repo
- must not be presented as a general public assistant

## Privacy and safety rules

IDARi may analyze internal system state, but it still must not bypass:
- privacy rules
- visibility rules
- auth requirements
- RLS boundaries

## Triad coordination

IDARi is one member of the triad:
- Dr. Eams = user-facing assistant
- IDARi = internal operator
- TheBoogieMan.Ai = policy and enforcement surface

Major system-level recommendations should follow the triad consensus model described in the README.

## Repo note

Older documentation used broader “autonomous improvement system” language. The canonical product wording is now **IDARi** and should be used first.
