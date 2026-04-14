# LAW.md – DREAMengin Product & System Law

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
15. **Shared Dream Collaboration**: Any Engin can become a real‑time collaborative workspace. Users invite others via link; shared view (top) and private controls (bottom). Supports code, music, games, design. Scales to 40+ users.
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

## 4. Additional Capabilities (Product Extensions)

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
