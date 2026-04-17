# GameEngin — Next-Gen Home-Console-Class Browser Platform

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)
> **Last Reframed:** 2026-04-17 — Spec-Engin HyperSICC consolidation

GameEngin is **not a game**. It is **the platform** — DREAMengin's proprietary,
console-class runtime that browser games are *built to run on*. We are moving
away from standalone games as first-class citizens. From this slice forward,
every game in the repo is a **cartridge** that runs on the single, coherent
**GameEngin Platform** (`engins/gameengin/`).

The platform's bar is simple and uncompromising: deliver a **next-gen home-
console-level full-capability experience inside a browser tab** — zero install,
quick-resume, controller-first, console-grade FX, AI-driven difficulty,
remote-play friendly.

## The single canonical surface

There is now exactly one entry point. New cartridges should target it; legacy
games already work through it without any code changes.

```ts
import { GameEnginPlatform } from '@/engins/gameengin/index';

const platform = await GameEnginPlatform.boot(canvas);
await platform.loadCartridge(MyCartridge);
```

That single import gives you the full console:

| Layer            | Provided by                                          |
|------------------|------------------------------------------------------|
| Renderer         | `EliteGameEngine` — WebGPU-first Babylon.js 9, ECS   |
| Adaptive budget  | `PerformanceBudget` — ultra/high/medium/low tiers    |
| Post-FX          | `PostFXManager` — bloom, glow, CA, vignette, grain   |
| AI Director      | `AIDirector` — TF.js on-device, zero server calls    |
| Power systems    | 20 subsystems (rollback netcode, GPU compute, BVH,   |
|                  | worker jobs, terrain, GI probes, asset streaming…)   |
| Cartridge bay    | `GameCartridge` + `loadCartridge` / `unloadCartridge`|
| Input            | Keyboard + Gamepad + DualSense (BT/USB/HID)          |
| Quick resume     | `saveQuickResume` / `loadQuickResume` / `clear…`     |
| Capabilities     | `detectCapabilities()` snapshot for adaptive UX      |
| Telemetry        | `platform.telemetry()` per-frame budget/FPS report   |

## Console-class capability surface

The platform reports what the host browser can actually do, so cartridges scale
themselves up to PS5-class behaviour where supported and gracefully down on
mid-tier mobiles.

```ts
import { detectCapabilities } from '@/engins/gameengin/index';

const caps = detectCapabilities();
// { webgpu, webgl2, gamepad, webhid, webBluetooth,
//   touch, coarsePointer, pointerLock, foreground,
//   deviceTier: 'ultra'|'high'|'medium'|'low',
//   cpuCores, deviceMemoryGb }
```

Capability tiers picked by the platform (`PerformanceBudget`):

| Tier   | FPS | Resolution | Shadows | PostFX | Particles |
|--------|-----|------------|---------|--------|-----------|
| ultra  | 60  | 100%       | ✅      | ✅     | 5000      |
| high   | 60  | 100%       | ✅      | ✅     | 2000      |
| medium | 60  | 85%        | ❌      | ✅     | 800       |
| low    | 30  | 70%        | ❌      | ❌     | 200       |

## Backwards compatibility — every existing game keeps working

This consolidation is **purely additive**. The platform is a facade over the
same primitives every existing game already imports:

* `EliteGameEngine`, `AIDirector`, `PostFXManager` — unchanged exports.
* Power-system classes (`RollbackNetcode`, `AdvancedPhysicsWorld`, …) — unchanged.
* `GameCartridge`, `GameEngineAPI`, `GRAVITY_VALUES`, `wrapAsCartridge`,
  `GameRuntime` — unchanged contracts.
* The legacy `components/daydream/GameEngin.tsx` and `engins/GameEngin.tsx`
  shells continue to host the daydream UI, score table, world builder, etc.

So all of these continue to work without modification:

* `components/games/BabylonSideScroller.tsx` (MADMAXI flagship platformer)
* `components/games/ENGINBattle.tsx` (RTS / strategy)
* `components/games/DREAMquest.tsx` (RPG / quest chains)
* `components/games/NeonDrift.tsx` (racing, elite-tier)
* `components/games/EchoArena.tsx` (top-down WebGPU shooter)
* `components/games/{TetrisGame, ChessGame, RTSGame, RPGGame, …}.tsx`
* `games/tetris/TetrisCartridge.ts` and any other repo-local cartridges

The platform's job is to **host them better**, not to break them.

## Shipping a cartridge (the canonical path)

Any new game ships as a `GameCartridge` and runs on the platform unchanged on
desktop, mobile, console-tier hardware, and remote-play sessions.

```ts
import type { GameCartridge } from '@/engins/gameengin/index';

export const MyCartridge: GameCartridge = {
  id: 'my-game',
  mount(container, api) {
    const off = api.loop.onTick((dt, elapsed) => { /* fixed-step update */ });
    api.input.on('keydown', (e) => { if (e.key === 'Escape') api.score.submit('my-game', 0); });
    return () => { off(); };
  },
};
```

Then anywhere a console session is being run:

```ts
const platform = await GameEnginPlatform.boot(canvas, {
  enableAIDirector: true,
  enablePostFX: true,
  gravity: 'earth',
});
await platform.loadCartridge(MyCartridge);
```

Existing React-component games can still be wrapped with `wrapAsCartridge`
without any change — the platform accepts the same `GameCartridge` shape.

## Quick-resume (console feel, in a tab)

```ts
platform.saveQuickResume({ level: 12, hp: 87, seed: 0xCAFE });
// later, even after a tab refresh:
const snapshot = platform.loadQuickResume<{ level: number; hp: number; seed: number }>('my-game');
```

## DualSense controller

`input/DualSenseManager.ts` continues to provide PS5 DualSense support
(Bluetooth pairing on Android 12+/iOS 14.5+, USB on desktop Chrome/Edge,
gyroscope steering/aiming, haptic rumble, full button mapping). Cartridges
read input through the `GameEngineAPI.input` bus so DualSense, keyboard, and
touch all flow through the same channel.

## Architecture map

```
engins/gameengin/                     ← The Platform (one coherent surface)
  platform.ts        ← GameEnginPlatform (boot, cartridges, quick resume)
  index.ts           ← Single import barrel
  core.ts            ← EliteGameEngine + ECSWorld + budget
  ai-director.ts     ← AIDirector (TF.js on-device adaptive difficulty)
  post-fx.ts         ← PostFXManager (bloom, glow, CA, vignette, grain)
  power-systems.ts   ← 20 console-class subsystems
  cartridge.ts       ← GameCartridge / GameEngineAPI contracts
  ReactComponentCartridge.ts  ← legacy React-game adapter (backwards compat)
  GameRuntime.tsx    ← React host that mounts a cartridge
  unifiedLoop.ts     ← Cross-cartridge shared RAF loop

components/gameengin/              ← Platform-side UI / hardware
  README.md          ← This file
  input/
    DualSenseManager.ts
```

## CI gate

The mandatory gate is unchanged and lives at the project root: `pnpm run build`
and `pnpm run test` (with `pnpm run preflight` for local checks). The
`.github/workflows/elite-gameengin-evolution.yml` workflow continues to score
each cartridge on the platform's feature dimensions and commit auto-fixes.

Per the Spec-Engin agent contract, every report-driven run must include at
least one **advanced** game / GameEngin upgrade — meaningful gameplay depth
(combat, AI, progression, simulation, narrative, procedural variety, boss
behaviour, late-game escalation) on a flagship cartridge, never a tap-only
loop. See `.github/agents/gameengin.md` for the full contract.
