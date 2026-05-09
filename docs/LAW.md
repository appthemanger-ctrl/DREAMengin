# LAW.md – DREAMengin Product & System Law

## §0 Bar Ownership Law (highest priority — supersedes any conflicting older text in this repo)

1. The DreamDM Bar is the **root container**. It is not a component, not a divider, not a seam, not a "handle between" the runtimes. It **owns** HomeDream Surface and DreamSpace, which are its **dependent runtimes**.
2. **Bar moves → runtimes are pushed.** When the bar slides up, HomeDream is pushed up with it; DreamSpace expands into the space the bar vacated below. When the bar slides down, DreamSpace is pushed down with it; HomeDream expands into the space the bar vacated above.
3. **Bar hidden → runtimes freeze in place; both stay on screen.** Hiding the bar removes only the bar's own UI. Both HomeDream and DreamSpace remain rendered at whatever split they held at the moment the bar disappeared. They cannot be resized (no mover present), but they MUST NOT be hidden, collapsed to zero height, or removed from screen.
4. **Each runtime always scrolls independently inside its own region — including when the bar is hidden.** Independent scroll is a property of being a runtime, not a privilege granted by the bar. The bar controls only the *size* of each region, never whether the region can scroll.
5. **The bar never displaces a runtime.** No bar position, hidden or otherwise, may cause either HomeDream or DreamSpace to be set to zero height, hidden, or to surrender its scroll.

---

## 1. Product Law (16 Foundational Principles)

1. Use README vocabulary first. Where OS-layer naming applies, use OS-layer canonical vocabulary.
2. Nothing is public by default.
3. Every visible action must do something real.
4. Dream Windows are the canonical modular runtime containers.
5. **HomeDream Surface** – Your home base. It's private, but you can invite others in or share parts if you want.
6. **Edit ProfileDream Surface** – Your workshop. You build your public face here, but you're not forced to make anything public until you're ready.
7. View Profile Surface is shared/public output only.
8. **DreamAds** are regular commercial breaks: 30 seconds of ads per 15 minutes of content; 2 minutes at the start for videos longer than 30 minutes. Ads cannot be skipped; rewatching replays the ad.
9. Dr. Eams is user-facing; IDARi is admin-only; TheBoogieMan.Ai is conservative enforcement.
10. **Build freely, clean as you go.** Don't leave orphaned code. No artificial "repurpose before invent" rule.
11. Algorithmic visibility is determined by **activity** (original creation, effort), not engagement (likes, shares). Views are the primary metric.
12. **Bot detection** uses a physical Turing test: jitter analysis, cross‑swipe similarity, coarse‑graining invariance, entropy, velocity variance, and a 4‑second view tally. Bots are blocked or throttled.
13. **Torridity constants** (`n=2.1`, `ΔP=0.1`, `λ=1.71`) govern swipe physics, content decay, invention force, and throttling. High‑mass human content resists decay; low‑mass bot content is capped at 10% visibility.
14. **Generation Law (ι‑Engine)**:  
    `ι = ΔP × (n·1 + a·λ + s·λ² + v·λ³ + xi·λ⁴)`  
    - `ι < 2.88` → FLOW (throttle, ship fast or skip)  
    - `2.88 ≤ ι < 9.59` → SYNTHESIZE (combine ideas, let flow)  
    - `ι ≥ 9.59` → MANIFEST (build immediately, no isolation, no split threshold)  
    High ι builds in every sense: code, UI, documents, real‑world actions.
15. **Shared Dream Collaboration (JAMM‑N web layer)**: Any Engin can become a real-time synchronized session runtime. Shared Dream is the canonical browser/session coordination layer (not firmware control) with typed event families (`peer_join`, `peer_leave`, `presence_update`, `cursor`, `edit`, `state_patch`, `media_sync`, `data_packet`, `control_signal`, `mode_change`), role-aware permissions, and swappable collaboration modes/rule-sets while preserving the top shared / bottom private UX.
16. **Universal Editor**: Tap‑hold (≥300ms) any module → drag to reposition or transfer to another runtime via edge detection. Each module has a manifest; transfer uses a local event bus.

---

## 2. Route Law (Naming Preferences)

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

---

## 3. OS‑Layer Naming Law (Canonical Vocabulary)

Always use canonical OS‑layer vocabulary:
- Say **surface**, not page
- Say **Dream Window**, not widget or card
- Say **DreamSpace**, not widget layer
- Say **HomeDream Surface** or **primary surface**, not top area
- Say **runtime**, not app
- Say **runtime environment**, not platform (whole system)
- Say **surface switching**, not tab navigation
- Say **bind / mount / activate**, not link widget / open page / launch card
- Say **connection path**, not pair

---

## 4. Architectural Commandments

1. **Start with DreamR.** DreamR is the first global reference for how features
   should be built in DREAMengin.
2. **Keep the core stable.** Core layers own runtime state, event flow,
   visibility enforcement, safety boundaries, and reusable contracts.
3. **Move variation into rule-sets.** Ranking, transforms, presets, thresholds,
   and domain-specific behavior belong in swappable rule-sets, not in ad hoc
   core forks.
4. **Compose before rewriting.** New behavior should be added by composing,
   replacing, or stacking rule-sets before changing core execution paths.
5. **Reject feature-specific cores.** If a new feature can only ship by making
   the core special-case that feature, the design is non-compliant and must be
   re-split.

DreamR reference:
- core reactor: `dreamdmbar/homedream/dreamr/dream.DreamRCore.tsx`
- feed surface: `dreamdmbar/homedream/dreamr/dream.DreamRFeed.tsx`
- rule-set logic: `dreamdmbar/homedream/dreamr/algorithms/dreamrAlgorithm.ts`

---

## 5. Additional Capabilities (Product Extensions)

17. **Fingerprint‑Based Sound Isolation** – Store audio peak maps (not raw audio). User taps a visual element (e.g., drum hit) → reference fingerprint → match against song's peak map → extract isolated sound from original audio. No AI model needed.
18. **3D Audio Visualizer** – Real‑time FFT bars/spheres in Babylon.js. Tap a bar → band‑pass filter → solo that frequency. Option to record filtered output as new sample.
19. **GameEngin** – Proprietary WebGPU+WASM runtime. Games Daydream is lobby/asset store; GameEngin is the actual game engine. Supports DualSense via Web Bluetooth. Game packages are `.dreamgame`.
20. **Engin Forge (NGN Engin)** – Visual builder where users select from 120+ atomic pieces (waveform zoom, beat grid, game loop, AI chat, etc.), wire them together, and build custom engines. Minimum 3 pieces, maximum 30. Runs in sandbox with local event bus. Users can share or publish their engines.
21. **Local Event Bus (no global bridge)** – Each engine assembly gets its own `createEventBus()`. Modules communicate only when explicitly wired. Dual runtime is an optional piece that creates a second bus and forwards messages between sides.
22. **DREAMenginOS** – The core upgrade piece. It exports all 120+ atomic capabilities and an `upgradeEngine()` function that adds OS‑level features (ledger, bridge, AI triad, telemetry) to any engine. The six official Engins are thin shells that import from DREAMenginOS.
23. **SICC Principle** – **Synchronized, Intuitive, Coherent, Cohesive**. The platform must feel real‑time, natural, logically consistent, and unified.
24. **DreamDM Bar** – The persistent root container. It never unmounts. It holds two resizable panes: HomeDream (top) and DreamSpace (bottom). Dragging the bar resizes them; snap points at 1.0, 0.9, 0.5, 0.1. Double‑tapping the Gold Button resets HomeDream content, not the bar. Hiding the bar is visual only; the bar remains in DOM.

---

*This law supersedes all previous product definitions. All AI agents (Dr. Eams, IDARi, TheBoogieMan.Ai, and external Copilot) must obey these rules and capabilities.*
