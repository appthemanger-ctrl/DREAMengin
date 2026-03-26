# DREAMengin Product Law

Status: active guardrail summary  
Last updated: 2026-03-25

This file summarizes the repo rules that must remain true while the codebase is aligned to the README and the canonical OS-Layer Naming Model.

## Product law

1. Use README vocabulary first. Where OS-layer naming applies, use OS-layer canonical vocabulary.
2. Nothing is public by default.
3. Every visible action must do something real.
4. Dream Windows are the canonical modular runtime containers.
5. HomeDream Surface is private source state.
6. Edit ProfileDream Surface is the private builder.
7. View Profile Surface is shared/public output only.
8. DreamAds are user-owned ad spaces and should not be confused with platform promotions.
9. Dr. Eams is user-facing; IDARi is admin-only; TheBoogieMan.Ai is conservative enforcement.
10. Repurpose legacy repo pieces before inventing new top-level systems.
11. Algorithmic visibility is determined by activity, not engagement. See `docs/ACTIVITY_FIRST_PROTOCOL.md`.
12. Views are the primary feed metric. No like counts. No follower-count ranking.
13. You cannot buy higher feed placement. The algorithm is blind to wallet size.
14. Ads are earned, not forced. Users always have a path to skip. No mid-roll interruptions.
15. Harmful content (self-harm, serious injury, death, dangerous stunts by non-professionals) is never promoted in feeds.
16. Activity points are earned only through verified activity and cannot be purchased.

## Route law

Prefer these names in docs and UI copy:
- HomeDream Surface (`HomeDream` in code)
- Edit ProfileDream Surface (`EditProfileDream` in code)
- View Profile Surface (`ViewProfile` in code)
- DreamShop Surface
- DreamMarketplace Surface
- DreamMenu
- DreamDM Surface
- DreamAds Surface

Support and legacy routes may still exist, but they should not win the language model.

## OS-layer naming law

Always use canonical OS-layer vocabulary:
- Say **surface**, not page
- Say **Dream Window**, not widget or card
- Say **DreamSpace**, not widget layer
- Say **Surface Space**, not top area
- Say **runtime**, not app
- Say **runtime environment**, not platform (whole system)
- Say **surface switching**, not tab navigation
- Say **bind / mount / activate**, not link widget / open page / launch card
- Say **connection path**, not pair

