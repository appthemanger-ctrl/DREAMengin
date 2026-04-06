# DREAMengin Elite Game Engine — 2026

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


The **Elite Game Engine** is DREAMengin's WebGPU-first, AI-powered, ECS-driven
web browser game runtime. It combines the best features of modern game engines
into a ridiculously capable piece of browser machinery.

## Architecture

```
lib/gameengin/
  core.ts        ← EliteGameEngine (ECS world, adaptive quality, telemetry)
  ai-director.ts ← AIDirector (TF.js in-browser adaptive difficulty)
  post-fx.ts     ← PostFXManager (bloom, glow, chromatic aberration, motion blur)
  index.ts       ← Public API barrel export

components/gameengin/
  README.md      ← This file
  input/
    DualSenseManager.ts  ← PS5 DualSense Bluetooth + USB controller
```

## Elite Engine Features

### WebGPU-First Rendering
- Babylon.js 8+ WebGPU backend with automatic WebGL2 fallback
- Adaptive resolution scaling (ultra/high/medium/low tiers)
- Hardware scaling level dynamically tuned by frame telemetry
- Post-processing: bloom, glow layer, chromatic aberration, vignette, grain

### ECS Architecture (`EliteGameEngine`)
```typescript
import { EliteGameEngine } from '@/lib/gameengin';

const elite = new EliteGameEngine(canvas);
await elite.init();

// Add entities and components
const entity = elite.world.createEntity();
elite.world.addComponent(entity, { type: 'transform', x: 0, y: 0 });

// Frame loop
elite.onFrame((dt, telemetry) => {
  console.log(telemetry.fps, telemetry.qualityTier);
});
```

### AI Director (`AIDirector`)
```typescript
import { AIDirector } from '@/lib/gameengin';

const director = new AIDirector();
await director.init(); // loads TF.js + WebGPU backend

// Every frame:
const state = director.update({ deaths, score, combo, avgSpeed, elapsed });
console.log(state.challengeLevel); // 0 (easy) → 1 (extreme)
console.log(state.label);          // "🟠 Heating up"
```

- TensorFlow.js 4.22.0 with WebGPU backend (privacy-first: zero server calls)
- 2-layer dense network mapping 5 player signals → challenge scalar
- Graceful heuristic fallback if TF.js unavailable
- Smooth lerp (5%/sample) prevents jarring difficulty jumps

### Post-FX Pipeline (`PostFXManager`)
```typescript
import { PostFXManager } from '@/lib/gameengin';

const fx = new PostFXManager(scene, camera);
await fx.init();       // DefaultRenderingPipeline + bloom + vignette
await fx.enableGlow(); // GlowLayer (stacks with pipeline bloom)

// Quality tier integration:
fx.applyBudget(eliteEngine.budget);
```

### Adaptive Performance Budget
The engine automatically detects frame pressure and downgrades quality:

| Tier | FPS target | Resolution | Shadows | PostFX | Particles |
|------|------------|------------|---------|--------|-----------|
| ultra | 60 | 100% | ✅ | ✅ | 5000 |
| high | 60 | 100% | ✅ | ✅ | 2000 |
| medium | 60 | 85% | ❌ | ✅ | 800 |
| low | 30 | 70% | ❌ | ❌ | 200 |

## Games Using This Infrastructure

### Neon Drift (`components/games/NeonDrift.tsx`) ⭐ Elite
- **WebGPU rendering** with Babylon.js + post-processing bloom + glow
- **AI Director** adapts obstacle frequency and base speed to player skill
- **5-lane procedural track** with ring-buffer tile recycling
- **Boss projectile obstacles** (boost gates for combo scoring)
- **Particle trail system** tied to speed and drifting
- **DualSense gyro steering** + R2 throttle + lane haptics
- **Score multiplier chains** from boost gate combos
- **Launch**: GamesHub → Neon Drift

### MADMAXI — Babylon Side Scroller (`components/games/BabylonSideScroller.tsx`) ⭐ Flagship
- **150 levels** · 15 zones · boss every 10 levels
- **🆕 Dash system**: Shift to dash (i-frames, DASH_COOL cooldown, combo setup)
- **🆕 Boss projectiles**: Bosses fire aimed projectiles at the player
- **🆕 Combo kills**: Chain stomps in 1.5s window for ×N score bonus
- **Coyote time** + jump buffering + double-jump
- **15 unique bosses** with enrage threshold + visual deformation
- **Procedural zones** with seeded generation (unique per session)
- **Launch**: GamesHub → MADMAXI

### Echo Arena (`components/games/EchoArena.tsx`)
- Top-down arena shooter with DualSense gyro aiming
- WebGPU rendering with Babylon.js
- **Launch**: GamesHub → Echo Arena

## DualSense Controller

`input/DualSenseManager.ts` - Full PS5 DualSense support:

- **Bluetooth pairing** on mobile (Android 12+, iOS 14.5+)
- **USB support** on desktop Chrome/Edge
- **Gyroscope steering/aiming** for natural mobile gameplay
- **Haptic rumble feedback** (Android Chrome best support)
- **Full button mapping** (Cross, Circle, Square, Triangle, L1/R1, L2/R2, D-pad)
- **Analog stick support** with deadzone management

### Pairing
**Mobile (Bluetooth):** Hold PS + Create until light flashes blue → pair in Bluetooth settings → open game in Chrome

**Desktop (USB):** Connect via USB-C → auto-detected

## GitHub Actions

### Elite GameEngin Evolution (`.github/workflows/elite-gameengin-evolution.yml`)
The most comprehensive game CI pipeline in DREAMengin:

1. **Build + Lint Gate** — Full Next.js build + ESLint + TypeScript checks
2. **Quality Analysis** — Scores each game on 13 engine feature dimensions
3. **AI Evolution Proposals** — GPT-4.1 proposes targeted upgrades based on quality scores
4. **Auto-Fix + Commit** — ESLint fixes auto-committed

Triggers on: push to `components/games/`, `lib/gameengin/`, `components/gameengin/`, daily at 06:00 UTC, manual dispatch with optional AI directive.

### Manual dispatch with directive:
```
# via GitHub UI: Actions → Elite GameEngin Evolution → Run workflow
# Directive: "add physics-based car destruction to NeonDrift"
# Game target: "neon-drift"
```

## Adding More Elite Games

1. Create `components/games/YourGame.tsx`
2. Import `EliteGameEngine` for rendering, `AIDirector` for difficulty, `PostFXManager` for FX
3. Use `useGameAutoStart`, `useGamePhase`, `useSubmitScore` hooks
4. Import `DualSenseManager` for controller support
5. Register in `GamesHub.tsx` GAMES array
6. Run `elite-gameengin-evolution.yml` to get AI-powered improvement suggestions

See `NeonDrift.tsx` as the canonical elite game reference implementation.

