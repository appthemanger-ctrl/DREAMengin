<start ai directives>  # GAMEENGIN PLATFORM: ABSOLUTE FINAL TECHNICAL SPECIFICATION

**Document ID:** GAMEENGIN-SPEC-2026-04-17-FINAL  
**Project:** DREAMengin Subsystem – Autonomous Console-Class Browser Gaming  
**Repository:** `appthemanger-ctrl/DREAMengin`  
**Branch:** `completedream`  
**Target:** PS5/PS6-equivalent logical performance on mobile browsers via WebGPU + WASM SIMD + Babylon.js 9.0  

---

## TABLE OF CONTENTS

1. [CARTRIDGE SPECIFICATION (`.dreamr` BINARY FORMAT)](#1-cartridge-specification-dreamr-binary-format)
   - 1.1 Container Format & Compression
   - 1.2 Internal Directory Structure
   - 1.3 MANIFEST.json Schema
   - 1.4 Scene Graph (FlatBuffers Schema)
   - 1.5 Asset Compression Standards
   - 1.6 WASM Module Specification
   - 1.7 Cartridge Loading Sequence
   - 1.8 Save State & Quick Resume
2. [FILE-BASED KNOWLEDGE BRAIN (R&D SUBSTRATE)](#2-file-based-knowledge-brain-rd-substrate)
   - 2.1 Directory Structure & Purpose
   - 2.2 File Formats & Examples
   - 2.3 Agent Read/Write Patterns
   - 2.4 Self-Improvement Mechanisms
3. [AUTONOMOUS STUDIO TEAM (AI AGENT ROLES)](#3-autonomous-studio-team-ai-agent-roles)
   - 3.1 Maestro (Orchestrator)
   - 3.2 Prophet (R&D / Fun Design)
   - 3.3 Artisan (Visual Asset Generation)
   - 3.4 Mechanic (Logic, Physics, WASM)
   - 3.5 Writer (Narrative & Dialogue)
   - 3.6 Tech Director (Performance & Optimization)
   - 3.7 Agent Communication & Workflow Dispatch
4. [R&D PIPELINE – FROM INSPIRATION TO DESIGN RULES](#4-rd-pipeline--from-inspiration-to-design-rules)
   - 4.1 Review Scraping & Sentiment Analysis
   - 4.2 Mechanical Extraction & Novelty Scoring
   - 4.3 Design Rule Synthesis & Storage
   - 4.4 Originality Vector Registry
5. [DEVELOPMENT PIPELINE – FROM DESIGN TO CARTRIDGE](#5-development-pipeline--from-design-to-cartridge)
   - 5.1 Level Generation & Environment Art
   - 5.2 Character/Sprite Generation
   - 5.3 WASM Logic Compilation
   - 5.4 Audio & Voiceover Integration
   - 5.5 Cartridge Packaging & Compression
   - 5.6 The "Pulse" – Autonomous Iteration
6. [RUNTIME PLATFORM (SHELL-FIRST / WEBGPU / HAVOK)](#6-runtime-platform-shell-first--webgpu--havok)
   - 6.1 Boot Sequence & Canvas Ownership
   - 6.2 WebGPU Renderer Configuration
   - 6.3 Havok Physics Integration (WASM)
   - 6.4 Input System (Gamepad, DualSense, Touch)
   - 6.5 Haptics Manager
   - 6.6 Telemetry & Performance Monitoring
7. [INTEGRATION WITH EXISTING DREAMENGIN REPOSITORY](#7-integration-with-existing-dreamengin-repository)
   - 7.1 Directory Mapping
   - 7.2 Database Migrations (Additive Only)
   - 7.3 Workflow File Additions & Modifications
   - 7.4 UI Navigation & Cartridge Browser
   - 7.5 Existing Game Cartridge Wrapping
8. [IMPLEMENTATION ROADMAP & 36-HOUR SPRINT PLAN](#8-implementation-roadmap--36-hour-sprint-plan)
9. [APPENDIX: COMPLETE FILE LISTINGS](#9-appendix-complete-file-listings)
   - A. Workflow YAML Files
   - B. Script Files
   - C. Database Migration SQL
   - D. Cartridge Manifest Example
   - E. Brain File Examples

---

## 1. CARTRIDGE SPECIFICATION (`.dreamr` BINARY FORMAT)

### 1.1 Container Format & Compression

| Property | Specification |
|----------|---------------|
| **Container** | POSIX ustar TAR archive |
| **Compression** | Zstandard (zstd) level 19 applied to the entire TAR |
| **File Extension** | `.dreamr` |
| **MIME Type** | `application/vnd.dreamengin.cartridge` |
| **Magic Bytes** | `0x44 0x52 0x4D 0x52` ("DRMR") at file start (after zstd decompression) |

**Rationale:**
- TAR is simple, widely supported, and streams well.
- zstd provides superior compression ratio and decompression speed vs gzip (critical for 5G mobile loads).
- Magic bytes allow runtime to validate cartridge integrity before full parse.

### 1.2 Internal Directory Structure

```
cartridge_name.dreamr (uncompressed TAR view)
│
├── MANIFEST.json                 # Required – cartridge metadata (see §1.3)
├── scene.graph                   # Required – FlatBuffers binary (see §1.4)
│
├── logic/
│   ├── main.wasm                 # Primary WASM module (AssemblyScript or Rust)
│   ├── bindings.js               # Optional – JS glue exports
│   └── modules/
│       ├── enemy_ai.wasm
│       └── ...
│
├── assets/
│   ├── textures/
│   │   ├── *.basis               # Basis Universal (UASTC/ETC1S)
│   │   └── atlas.json            # Optional texture atlas mapping
│   ├── meshes/
│   │   ├── *.draco.glb           # Draco-compressed glTF binary
│   │   └── collision/
│   │       └── *.convex          # Simplified convex hulls (JSON or binary)
│   ├── audio/
│   │   ├── bgm.opus              # Opus music (64–128 kbps)
│   │   ├── sfx/
│   │   │   └── *.opus            # Opus SFX (32 kbps)
│   │   └── voice/
│   │       └── *.opus            # TTS voiceovers (32 kbps)
│   └── shaders/
│       └── custom.wgsl           # Optional WebGPU shader overrides
│
├── story/
│   ├── beats.json                # Narrative triggers & dialogue (see §4.5)
│   └── localization/
│       └── {lang}.json
│
└── data/
    ├── levels.json               # Level definitions (if not embedded in scene.graph)
    ├── enemies.json              # Enemy stats and behavior trees
    ├── tuning.json               # Balance parameters (gravity, speeds, etc.)
    └── credits.json              # Attributions for AI-generated content
```

### 1.3 MANIFEST.json Schema

```json
{
  "$schema": "https://dreamengin.com/schemas/cartridge-manifest-v1.json",
  "dreamr_version": 1,
  "cartridge_id": "mad-maxi",
  "title": "Mad Maxi",
  "author": "DreamR Studio (AI Orchestrated)",
  "version": "1.0.0",
  "entry": "logic/main.wasm",
  "render_mode": "webgpu",
  "permissions": ["storage", "multiplayer", "haptics"],
  "cover_art": "assets/cover.basis",
  "min_quality_tier": "medium",
  "target_frame_rate": 60,
  "memory_budget_mb": 256,
  "save_schema_version": 2,
  "dependencies": {
    "gameengin_runtime": ">=1.0.0"
  },
  "metadata": {
    "genre": ["platformer", "action"],
    "estimated_playtime_minutes": 240,
    "player_count": [1],
    "tags": ["neon", "emotional", "procedural", "side-scroller"]
  }
}
```

### 1.4 Scene Graph (FlatBuffers Schema)

**File:** `schema/scene_graph.fbs` (to be compiled with `flatc`)

```flatbuffers
namespace GameEngin.Cartridge;

enum NodeType : byte { EMPTY = 0, MESH = 1, LIGHT = 2, CAMERA = 3, COLLIDER = 4, PARTICLE_EMITTER = 5 }

table Vec3 { x: float; y: float; z: float; }
table Quat { x: float; y: float; z: float; w: float; }
table Vec4 { x: float; y: float; z: float; w: float; }

table Transform {
  position: Vec3;
  rotation: Quat;
  scale: Vec3;
}

table Material {
  base_color: Vec4;
  metallic: float;
  roughness: float;
  emissive: Vec3;
  emissive_intensity: float;
  alpha_mode: int;               // 0=OPAQUE, 1=MASK, 2=BLEND
  alpha_cutoff: float;
  base_color_tex: int32;         // index into texture array, -1 = none
  normal_tex: int32;
  metallic_roughness_tex: int32;
  occlusion_tex: int32;
  emissive_tex: int32;
}

table Mesh {
  name: string;
  vertex_data: [ubyte];          // Draco compressed interleaved vertex attributes
  index_data: [ubyte];           // Draco compressed indices
  vertex_count: uint32;
  index_count: uint32;
  material_id: int32;
  bounds_min: Vec3;
  bounds_max: Vec3;
}

table Node {
  name: string;
  type: NodeType;
  transform: Transform;
  mesh_id: int32;                // -1 if none
  children: [uint32];            // indices into the nodes array
}

table Texture {
  name: string;
  data: [ubyte];                 // Basis Universal compressed
  format: int;                   // 0=BASIS_UASTC, 1=BASIS_ETC1S
}

table SceneGraph {
  nodes: [Node];
  meshes: [Mesh];
  materials: [Material];
  textures: [Texture];
  root_node: uint32;
  default_camera: uint32;
}

root_type SceneGraph;
```

### 1.5 Asset Compression Standards

| Asset Type | Format | Compression | Target Size | Notes |
|------------|--------|-------------|-------------|-------|
| **Textures** | Basis Universal | UASTC (high) or ETC1S (medium) | < 2 MB per 2048² | Transcodes at runtime to BC7/ASTC/ETC2 based on GPU |
| **Meshes** | glTF Binary | Draco Edgebreaker, quantized 14-bit | < 500 KB per 50k tris | Decoded in Web Worker using WASM SIMD |
| **Audio (Music)** | Opus | 64–128 kbps VBR | < 3 MB per 3 min | Streamed via Web Audio API |
| **Audio (SFX/Voice)** | Opus | 32 kbps | < 100 KB per 10 sec | |
| **WASM Logic** | WebAssembly | Binaryen `wasm-opt -Oz` | < 500 KB total | SIMD enabled, bulk memory |

### 1.6 WASM Module Specification

**Required Exports:**

```typescript
// Every cartridge's main.wasm MUST export:
export function init(platformPtr: number): void;           // Called once after load
export function update(deltaMs: number): void;            // Called each frame
export function handleInput(inputStatePtr: number): void; // Called before update
export function getSnapshotSize(): number;                // Returns bytes needed for save
export function writeSnapshot(bufferPtr: number): void;   // Writes save state to linear memory
export function loadSnapshot(bufferPtr: number): void;    // Restores from save state
export function getMemoryUsage(): number;                 // Returns current heap usage

// Memory export
export const memory: WebAssembly.Memory;
```

**AssemblyScript Example (Player Controller Skeleton):**

```typescript
// assembly/cartridge_player.ts (compiled to main.wasm)
export const COYOTE_TIME_FRAMES: i32 = 6;
export const INPUT_BUFFER_FRAMES: i32 = 8;

class PlayerState {
  x: f32 = 0; y: f32 = 0;
  vx: f32 = 0; vy: f32 = 0;
  onGround: bool = false;
  coyoteTimer: i32 = 0;
  jumpBuffer: i32 = 0;
}

const state = new PlayerState();

export function update(deltaMs: f32): void {
  const dt = deltaMs / 1000.0;
  // Physics integration (simplified)
  state.vy -= 15.0 * dt;
  state.x += state.vx * dt;
  state.y += state.vy * dt;
  // ... rest of logic
}

export function handleInput(inputPtr: usize): void {
  // inputPtr points to a struct: { left: bool, right: bool, jump: bool, ... }
  // Process and buffer inputs
}
```

### 1.7 Cartridge Loading Sequence

```typescript
// lib/gameengin/cartridge-loader.ts
async function loadCartridge(url: string): Promise<LoadedCartridge> {
  // 1. Fetch compressed cartridge
  const response = await fetch(url);
  const compressed = await response.arrayBuffer();
  
  // 2. Verify magic bytes (first 4 bytes after decompression)
  const decompressed = await decompressZstd(compressed);
  if (new Uint8Array(decompressed, 0, 4).join() !== '68,82,77,82') {
    throw new Error('Invalid .dreamr file');
  }
  
  // 3. Parse TAR
  const entries = parseTar(decompressed);
  
  // 4. Parse MANIFEST.json
  const manifest = JSON.parse(new TextDecoder().decode(entries['MANIFEST.json']));
  
  // 5. Parse scene.graph (FlatBuffers zero-copy)
  const sceneBuf = new flatbuffers.ByteBuffer(entries['scene.graph']);
  const sceneGraph = SceneGraph.getRootAsSceneGraph(sceneBuf);
  
  // 6. Upload textures to GPU (Basis transcode)
  const textures = await uploadBasisTextures(entries, sceneGraph);
  
  // 7. Upload meshes (Draco decode in worker pool)
  const meshes = await uploadDracoMeshes(entries, sceneGraph);
  
  // 8. Instantiate Babylon scene
  const babylonScene = buildBabylonScene(sceneGraph, textures, meshes);
  
  // 9. Load and instantiate WASM
  const wasmModule = await WebAssembly.instantiate(entries['logic/main.wasm'], imports);
  wasmModule.exports.init(platformPtr);
  
  return { manifest, babylonScene, wasmModule };
}
```

### 1.8 Save State & Quick Resume

Snapshots are stored in Supabase (`gameengin_snapshots` table). The cartridge exports functions to serialize/deserialize its state into a binary buffer.

```typescript
// Save
const size = wasm.exports.getSnapshotSize();
const buffer = new Uint8Array(size);
wasm.exports.writeSnapshot(buffer.byteOffset);
await supabase.from('gameengin_snapshots').insert({
  player_id: userId,
  cartridge_id: manifest.cartridge_id,
  snapshot_data: bufferToBase64(buffer),
  client_timestamp: performance.now()
});

// Load
const { data } = await supabase.from('gameengin_snapshots')
  .select('snapshot_data')
  .eq('player_id', userId)
  .eq('cartridge_id', cartridgeId)
  .single();
if (data) {
  const buffer = base64ToBuffer(data.snapshot_data);
  wasm.exports.loadSnapshot(buffer.byteOffset);
}
```

---

## 2. FILE-BASED KNOWLEDGE BRAIN (R&D SUBSTRATE)

### 2.1 Directory Structure & Purpose

The Brain is a version-controlled directory at `lib/gameengin/brain/`. It is the **single source of truth** for game design knowledge, inspiration, and originality tracking.

```
lib/gameengin/brain/
├── README.md                           # Agent usage guide
│
├── principles/                         # Timeless axioms of game feel
│   ├── responsiveness.md
│   ├── feedback.md
│   ├── progression.md
│   ├── risk-reward.md
│   ├── mastery.md
│   └── emotional-core.md
│
├── genre-dna/                          # What defines each genre
│   ├── platformer.json
│   ├── metroidvania.json
│   ├── action-rpg.json
│   ├── roguelike.json
│   ├── puzzle.json
│   ├── racing.json
│   └── template.json                   # For new genre creation
│
├── mechanic-library/                   # Catalog of proven mechanics
│   ├── movement/
│   │   ├── double-jump.json
│   │   ├── dash.json
│   │   ├── wall-slide.json
│   │   ├── grapple.json
│   │   └── coyote-time.json
│   ├── combat/
│   │   ├── parry.json
│   │   ├── combo.json
│   │   ├── ranged.json
│   │   └── hit-stop.json
│   ├── progression/
│   │   ├── metroidvania-gating.json
│   │   ├── skill-tree.json
│   │   └── roguelike-perks.json
│   └── camera/
│       ├── smooth-follow.json
│       ├── look-ahead.json
│       └── screen-shake.json
│
├── inspiration-corpus/                 # Deep analysis of great games (2006-2026)
│   ├── celeste.json
│   ├── hollow-knight.json
│   ├── hades.json
│   ├── outer-wilds.json
│   ├── dead-cells.json
│   └── ... (Prophet expands this)
│
├── fun-heuristics/                     # Quantifiable "fun" signals
│   ├── moment-to-moment.json
│   ├── session-loop.json
│   └── meta-progression.json
│
├── review-corpus/                      # Cached review data (scraped)
│   ├── metacritic/
│   │   └── {game-slug}.json
│   ├── steam/
│   │   └── {appid}.json
│   └── opencritic/
│       └── {game-id}.json
│
├── originality-registry/               # Prevents accidental clones
│   ├── signatures.json                 # Hash signatures of generated mechanics combos
│   └── by-cartridge/
│       └── {cartridge_id}.json
│
├── rd-sessions/                        # Logs of every AI research session
│   └── YYYY-MM-DD-{agent}-{topic}.md
│
├── predictions/                        # AI fun score predictions
│   ├── pending/
│   │   └── {timestamp}-{mechanic-hash}.json
│   └── validated/
│       └── {timestamp}-{mechanic-hash}.json
│
└── visual-bible/                       # Art style references
    ├── environments/
    │   ├── neon-wasteland.md
    │   └── ...
    └── characters/
        └── mad-maxi.md
```

### 2.2 File Formats & Examples

#### `principles/responsiveness.md`

```markdown
# Principle: Responsiveness

## Definition
The game must feel like a direct extension of the player's intent. Input latency, frame rate, and control predictability are paramount.

## Quantifiable Targets (Web Environment)
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| End-to-end latency | < 50 ms | `performance.now()` from input event to frame commit |
| Frame time | 16.67 ms (60 FPS) | `requestAnimationFrame` delta |
| Coyote time frames | 6 frames | Game logic counter |
| Input buffer frames | 8 frames | Game logic counter |
| Jump variable height | Hold to rise, release to fall faster | Gravity multiplier on jump hold |

## Implementation (WebGPU/Babylon.js)
- Use fixed timestep (60 Hz) for physics in WASM.
- Process all inputs once at the start of `requestAnimationFrame`.
- Avoid `setTimeout`/`setInterval` for game logic.
- Use Web Workers for Draco/Basis decoding to keep main thread free.

## Anti-Patterns to Avoid
- Variable frame rate physics.
- Reading input state mid-frame after physics has started.
- Blocking the main thread with synchronous asset decoding.

## Source Games Analyzed
- Celeste (2018): 6-frame coyote time, 8-frame input buffer.
- Super Meat Boy (2010): Instant respawn, tight air control.
- Hollow Knight (2017): Responsive dash, predictable knockback.
```

#### `genre-dna/platformer.json`

```json
{
  "genre": "Platformer",
  "subgenres": ["precision", "puzzle", "action", "endless-runner", "metroidvania"],
  "core_mechanic": "Player-controlled avatar navigates 2D/3D space using jumping and movement abilities.",
  "emotional_core": "mastery",
  "player_motivation": "Overcome precise challenges through skill improvement.",
  "essential_feel": {
    "movement": "tight, predictable, with optional momentum",
    "jump": "variable height, coyote time, input buffering",
    "camera": "predictive, smooth follow with look-ahead"
  },
  "pacing_profile": {
    "early": "Introduce core movement, safe zones",
    "mid": "Combine mechanics, increase precision demands",
    "late": "Mastery challenges, optional hard content"
  },
  "canonical_examples": [
    {
      "title": "Celeste",
      "year": 2018,
      "what_makes_it_special": "Perfect difficulty curve, assist mode accessibility, screen-by-screen respawn.",
      "mechanical_innovations": ["dash with direction lock", "stamina-limited climbing", "screen-wrapping rooms"],
      "emotional_impact": "Empowerment through overcoming personal struggle (narrative+gameplay synergy)."
    }
  ],
  "anti_patterns": [
    "Slippery/ice physics without player intent",
    "Inconsistent collision (getting stuck on corners)",
    "Off-screen hazards with no warning",
    "Long runbacks after death"
  ]
}
```

#### `mechanic-library/movement/double-jump.json`

```json
{
  "name": "Double Jump",
  "category": "movement",
  "description": "Player can perform a second jump while airborne.",
  "emotional_impact": ["freedom", "forgiveness", "skill expression"],
  "implementation": {
    "state_machine": "GROUND -> JUMP -> AIR -> DOUBLE_JUMP -> FALL",
    "parameters": {
      "first_jump_force": 8.0,
      "double_jump_force": 7.0,
      "can_double_jump_after_wall_slide": true,
      "resets_on_ground": true
    },
    "visual_feedback": {
      "particle_burst": "double_jump_particles",
      "sound": "sfx_jump_double",
      "animation_trigger": "double_jump"
    },
    "haptic_feedback": {
      "pattern": [50],
      "weak_magnitude": 0.3,
      "strong_magnitude": 0.1
    }
  },
  "games_using": ["Celeste", "Hollow Knight", "Ori and the Blind Forest"],
  "fun_heuristics": {
    "increases_exploration_possibility": 0.8,
    "reduces_frustration_from_mistimed_jumps": 0.7,
    "skill_ceiling_increase": 0.6
  }
}
```

#### `inspiration-corpus/celeste.json`

```json
{
  "game_title": "Celeste",
  "release_year": 2018,
  "developer": "Maddy Makes Games",
  "genre": ["platformer", "precision"],
  "what_makes_it_special": "Flawless integration of narrative theme (overcoming anxiety) with gameplay difficulty. Accessibility options without compromising core experience.",
  "mechanical_innovations": [
    {
      "name": "Dash",
      "description": "Eight-directional dash that recharges on ground touch.",
      "impact": "Adds depth to movement, allows sequence breaking, feels incredibly responsive."
    },
    {
      "name": "Assist Mode",
      "description": "Adjustable game speed, infinite stamina, invincibility.",
      "impact": "Allows players of all skill levels to experience the story and game."
    }
  ],
  "emotional_impact": "Players report feeling a sense of accomplishment and catharsis, mirroring the protagonist's journey.",
  "design_lessons_applicable": [
    "Tight, forgiving controls (coyote time, input buffering) are non-negotiable for precision platformers.",
    "Narrative and gameplay difficulty can reinforce each other.",
    "Accessibility options expand audience without diluting core experience."
  ],
  "review_sentiment_score": 0.96,
  "scraped_reviews_count": 12450,
  "analyzed_at": "2026-04-17T00:00:00Z"
}
```

#### `originality-registry/signatures.json`

```json
{
  "signatures": [
    {
      "hash": "sha256:platformer+double_jump+dash+parry",
      "cartridge_ids": ["mad-maxi"],
      "closest_known_game": "Hollow Knight (similar movement suite)",
      "differentiation_factors": ["neon aesthetic", "father-son narrative", "procedural level pulse"],
      "novelty_score": 0.72
    }
  ]
}
```

### 2.3 Agent Read/Write Patterns

All agents interact with the brain using simple Node.js `fs` operations during workflow execution.

**Read Example (Prophet getting genre DNA):**

```typescript
// scripts/gameengin/lib/brain-reader.ts
import * as fs from 'fs';
import * as path from 'path';

const BRAIN_ROOT = path.join(process.cwd(), 'lib/gameengin/brain');

export function readGenreDNA(genre: string): any {
  const filePath = path.join(BRAIN_ROOT, 'genre-dna', `${genre}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Genre DNA not found: ${genre}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function readMechanic(mechanicPath: string): any {
  const filePath = path.join(BRAIN_ROOT, 'mechanic-library', `${mechanicPath}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
```

**Write Example (Prophet logging research session):**

```typescript
export function logRDSession(agent: string, topic: string, findings: any): void {
  const date = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const fileName = `${date}-${agent}-${topic}-${timestamp}.json`;
  const filePath = path.join(BRAIN_ROOT, 'rd-sessions', fileName);
  
  const log = {
    agent,
    topic,
    timestamp: new Date().toISOString(),
    findings,
    git_commit: process.env.GITHUB_SHA || 'local'
  };
  
  fs.writeFileSync(filePath, JSON.stringify(log, null, 2));
}
```

### 2.4 Self-Improvement Mechanisms

1. **Prophet** reads `rd-sessions/` from previous runs to avoid re-researching the same ground.
2. **Mechanic** compares generated WASM performance against `predictions/validated/` to refine future generation.
3. **Maestro** analyzes telemetry and updates `fun-heuristics/` with empirical data (e.g., "levels with double-jump have 23% higher completion rate").
4. **Artisan** updates `visual-bible/` with successful prompt/parameter combinations.
5. **Originality Registry** prevents agents from generating mechanics combos that already exist in another cartridge.

---

## 3. AUTONOMOUS STUDIO TEAM (AI AGENT ROLES)

### 3.1 Maestro (Orchestrator)

- **Workflow File:** `.github/workflows/gameengin-maestro.yml`
- **Schedule:** Twice daily (02:00 and 14:00 UTC) + manual trigger
- **Responsibilities:**
  - Query `gameengin_telemetry` from Supabase for the target cartridge.
  - Compute metrics: death heatmap, average FPS, quit points, story skip rate.
  - Decide which agents to dispatch based on thresholds:
    - Deaths > 50 in a level → dispatch Prophet (difficulty tuning needed)
    - Avg FPS < 45 → dispatch Tech Director (optimization needed)
    - Quits > 20 → dispatch Artisan (visual fatigue)
    - Story skips > 10 → dispatch Writer (narrative engagement)
  - Write insights to `.gameengin-maestro-insights.json` and commit to repo.
  - Dispatch agent workflows via `gh workflow run`.
  - Review and merge PRs created by agents (or flag for human review if confidence low).

### 3.2 Prophet (R&D / Fun Design)

- **Workflow File:** `.github/workflows/gameengin-prophet.yml`
- **Triggers:** Called by Maestro, or manual with cartridge ID.
- **Responsibilities:**
  - Determine target genre from cartridge manifest or infer from name.
  - Check brain for existing research (`rd-sessions/`). If recent (<7 days), skip or augment.
  - Scrape reviews:
    - Metacritic user reviews for top 5 games in genre.
    - Steam reviews (using public endpoints, no API key required for public data).
    - OpenCritic if API available.
  - Use LLM (OpenRouter with Claude) to extract:
    - Core "fun" factors mentioned in reviews.
    - Specific mechanical parameters (coyote time frames, jump force, etc.).
    - Common complaints (to avoid).
  - Synthesize design rules and write to:
    - `cartridge_design_rules` table in Supabase (for Mechanic consumption).
    - Brain: `inspiration-corpus/{game}.json` for new games analyzed.
    - Brain: `rd-sessions/` with full research log.
  - Propose novel mechanic combinations by reading `mechanic-library/` and checking `originality-registry/`.
  - Open a PR with findings and proposed design rule updates.

### 3.3 Artisan (Visual Asset Generation)

- **Workflow File:** `.github/workflows/gameengin-artisan.yml`
- **Triggers:** Called by Maestro, or manual.
- **Responsibilities:**
  - Generate cover art:
    - Prompt engineering using brain's `visual-bible/` references.
    - Call Replicate API (SDXL) with hand-drawn style prompt.
    - Save as `public/cartridges/{id}/cover.webp`.
  - Generate environment tilesets:
    - If needed (based on Maestro's visual fatigue flag), generate new background tiles.
    - Use ComfyUI or Replicate with ControlNet for tileable output.
    - Convert to Basis Universal format.
  - Generate character sprites:
    - Based on `visual-bible/characters/{id}.md` description.
    - Output sprite sheets.
  - Commit assets directly to the cartridge directory.
  - Open PR with new assets.

### 3.4 Mechanic (Logic, Physics, WASM)

- **Workflow File:** `.github/workflows/gameengin-mechanic.yml`
- **Triggers:** Called by Maestro, or manual.
- **Responsibilities:**
  - Fetch design rules from Supabase `cartridge_design_rules` for target cartridge.
  - Read relevant mechanics from brain's `mechanic-library/`.
  - Generate AssemblyScript code for:
    - Player controller (state machine, physics integration).
    - Enemy AI (behavior trees compiled to WASM).
  - Compile to WASM using `asc` with SIMD and bulk memory enabled.
  - Validate WASM size < 500 KB.
  - Write `logic/main.wasm` to cartridge directory.
  - Open PR with updated logic.

### 3.5 Writer (Narrative & Dialogue)

- **Workflow File:** `.github/workflows/gameengin-writer.yml`
- **Triggers:** Called by Maestro, or manual.
- **Responsibilities:**
  - Read cartridge metadata and existing story beats from `story/beats.json`.
  - Determine next narrative milestone based on player progress (telemetry).
  - Generate story beat using LLM (Claude via OpenRouter):
    - 2-3 sentences of voiceover from protagonist.
    - Appropriate emotion tag (hopeful, weary, determined).
  - Generate TTS using ElevenLabs API.
  - Save as Opus file in `assets/audio/voice/`.
  - Update `story/beats.json`.
  - Open PR with new narrative content.

### 3.6 Tech Director (Performance & Optimization)

- **Workflow File:** Integrated into `dreamengin-preflight.yml` as a job.
- **Triggers:** On PR, and on-demand via manual dispatch.
- **Responsibilities:**
  - Run Playwright tests simulating mobile Safari (iPhone 15 Pro).
  - Measure:
    - Average FPS over 60 seconds of gameplay.
    - Main thread CPU usage.
    - GPU memory usage.
  - If performance below threshold:
    - Suggest reducing shadow map size.
    - Suggest lowering particle count.
    - Suggest disabling expensive post-FX (SSAO, god rays).
  - Validate WASM size < 500 KB.
  - Block PR merge if performance regresses significantly.

### 3.7 Agent Communication & Workflow Dispatch

Agents are dispatched via GitHub CLI in the Maestro script:

```typescript
// scripts/gameengin/maestro-analyze.ts (excerpt)
import { execSync } from 'child_process';

function dispatchAgent(agent: string, cartridgeId: string) {
  const workflowMap: Record<string, string> = {
    prophet: 'gameengin-prophet.yml',
    mechanic: 'gameengin-mechanic.yml',
    artisan: 'gameengin-artisan.yml',
    writer: 'gameengin-writer.yml',
  };
  
  const workflow = workflowMap[agent];
  console.log(`🎭 Dispatching ${agent} for ${cartridgeId}...`);
  execSync(`gh workflow run ${workflow} -f target_cartridge=${cartridgeId}`, {
    env: { ...process.env, GH_TOKEN: process.env.GITHUB_TOKEN },
    stdio: 'inherit'
  });
}
```

---

## 4. R&D PIPELINE – FROM INSPIRATION TO DESIGN RULES

### 4.1 Review Scraping & Sentiment Analysis

**Script:** `scripts/gameengin/prophet-scrape.ts`

- Uses Playwright to scrape Metacritic user reviews.
- Extracts: review text, score (1-10), date, helpful count.
- Performs simple sentiment analysis: positive/negative keyword counting.
- Caches raw review JSON in `brain/review-corpus/metacritic/{slug}.json`.

### 4.2 Mechanical Extraction & Novelty Scoring

**Script:** `scripts/gameengin/prophet-extract.ts`

- Takes scraped reviews and feeds to LLM with prompt:
  ```
  You are a game design expert. Analyze these reviews for the game {game_title}.
  Extract:
  1. What specific mechanics make the game feel "fun" or "responsive"?
  2. Any quantifiable parameters mentioned (e.g., "jump feels floaty" -> gravity value?).
  3. Common complaints about controls or feel.
  
  Output JSON format:
  {
    "fun_factors": string[],
    "extracted_parameters": { "coyote_time_frames": number, ... },
    "complaints": string[]
  }
  ```
- Compares extracted mechanics against `originality-registry/` to compute novelty score.

### 4.3 Design Rule Synthesis & Storage

**Script:** `scripts/gameengin/prophet-upload.ts`

- Combines extracted parameters with existing genre DNA.
- Writes to Supabase `cartridge_design_rules` table.
- Also writes to brain `rd-sessions/` for audit trail.

### 4.4 Originality Vector Registry

**Purpose:** Prevent the AI from generating "Hollow Knight clone #47".

- **Mechanic Signature Hash:** `sha256(genre + mechanic1 + mechanic2 + ...)`
- Stored in `brain/originality-registry/signatures.json`.
- Before generating a new cartridge, Prophet checks this registry.
- If hash exists with novelty score < 0.3, it must propose a differentiation factor (e.g., "add grappling hook", "set in underwater city").

---

## 5. DEVELOPMENT PIPELINE – FROM DESIGN TO CARTRIDGE

### 5.1 Level Generation & Environment Art

- **Artisan** uses ComfyUI with ControlNet (depth/normal maps) to generate tileable environment tiles.
- Tiles are saved as Basis Universal to `public/cartridges/{id}/assets/environments/`.
- **Mechanic** generates level data (platform positions, enemy spawns) based on design rules.
- Level data is stored in `data/levels.json` or embedded in `scene.graph`.

### 5.2 Character/Sprite Generation

- **Artisan** uses Replicate (SDXL) with prompt derived from `visual-bible/characters/{id}.md`.
- Outputs sprite sheet (multiple frames) and converts to Basis texture.
- **Mechanic** references sprite sheet in WASM animation logic.

### 5.3 WASM Logic Compilation

- **Mechanic** writes AssemblyScript to `assembly/{cartridge_id}_player.ts`.
- Compilation command:
  ```bash
  npx asc assembly/{cartridge_id}_player.ts \
    -o public/cartridges/{id}/logic/main.wasm \
    --optimizeLevel 3 \
    --shrinkLevel 2 \
    --enable simd \
    --enable bulk-memory \
    --exportRuntime
  ```
- Post-compile, `wasm-opt -Oz` further reduces size.

### 5.4 Audio & Voiceover Integration

- **Writer** generates TTS and saves to `assets/audio/voice/`.
- **Artisan** can generate simple SFX using web audio API synthesis (no external API needed) or use pre-existing library.
- All audio encoded as Opus via FFmpeg (installed on GitHub runner).

### 5.5 Cartridge Packaging & Compression

**Script:** `scripts/gameengin/package-cartridge.ts`

1. Assemble all files into TAR using `tar` npm package or system `tar` command.
2. Compress with `zstd -19 -o output.dreamr input.tar`.
3. Validate magic bytes and manifest.
4. Upload to Vercel Blob or serve from `public/cartridges/`.

### 5.6 The "Pulse" – Autonomous Iteration

Every 10 levels of *Mad Maxi*, Maestro triggers a **Pulse**:

1. Telemetry analysis as usual.
2. Prophet may suggest adjusting enemy count or platform spacing based on death heatmap.
3. Mechanic updates `tuning.json` with new values.
4. Artisan refreshes background tiles for visual variety.
5. Writer adds a story beat.
6. New `.dreamr` is built and deployed; players download a small patch (5-10 MB) without page refresh.

---

## 6. RUNTIME PLATFORM (SHELL-FIRST / WEBGPU / HAVOK)

### 6.1 Boot Sequence & Canvas Ownership

```typescript
// lib/gameengin/platform.ts (excerpt)
export async function boot(options: PlatformBootOptions): Promise<GameEnginPlatform> {
  // 1. Acquire canvas mutex
  if (canvas['__GAMEENGIN_OWNER__']) throw new Error('Canvas already owned');
  canvas['__GAMEENGIN_OWNER__'] = true;
  
  // 2. Detect capabilities
  const caps = await detectCapabilities();
  const qualityTier = computeQualityTier(caps);
  
  // 3. Create Babylon engine (WebGPU preferred)
  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
    powerPreference: 'high-performance'
  });
  
  // 4. Create scene
  const scene = new BABYLON.Scene(engine);
  
  // 5. Initialize Havok physics
  const havok = await HavokPhysics();
  const physicsPlugin = new BABYLON.HavokPlugin(true, havok);
  scene.enablePhysics(null, physicsPlugin);
  
  // 6. Initialize AI Director (TensorFlow.js)
  const aiDirector = new AIDirector();
  await aiDirector.loadModel('/models/difficulty_tuner.tfjs');
  
  // 7. Initialize PostFX
  const postFX = new PostFXManager(scene);
  
  // 8. Start render loop
  engine.runRenderLoop(() => scene.render());
  
  return { engine, scene, havok, aiDirector, postFX, /* ... */ };
}
```

### 6.2 WebGPU Renderer Configuration

- **MSAA:** 4x on ultra/high, 2x on medium, off on low.
- **Shadow Map Size:** 4096 ultra → 512 low (dynamic based on quality tier).
- **Texture Format:** `bgra8unorm` (required for bindless textures).

### 6.3 Havok Physics Integration (WASM)

```typescript
// lib/gameengin/physics-world.ts
class PhysicsWorld {
  private havok: HavokPhysics;
  private fixedDeltaTime = 1/60;
  
  update(deltaTime: number) {
    this.accumulator += deltaTime;
    while (this.accumulator >= this.fixedDeltaTime) {
      this.havok.step(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }
    // Interpolate render positions
  }
}
```

### 6.4 Input System (Gamepad, DualSense, Touch)

Unified input manager maps all sources to a standard `InputState` struct passed to WASM.

```typescript
interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
  attack: boolean;
  pause: boolean;
}
```

### 6.5 Haptics Manager

- Uses `navigator.vibrate()` for mobile.
- Uses Gamepad API `vibrationActuator` for DualSense (if available).
- Collision impulses trigger haptic patterns defined in `mechanic-library/`.

### 6.6 Telemetry & Performance Monitoring

- Every frame, FPS is recorded.
- Every 10 seconds, a telemetry event is sent to Supabase `gameengin_telemetry`.
- Events include: `fps_sample`, `death`, `level_complete`, `item_collected`, `story_skip`.
- Maestro queries this table to make decisions.

---

## 7. INTEGRATION WITH EXISTING DREAMENGIN REPOSITORY

### 7.1 Directory Mapping

| GameEngin Component | Existing DREAMengin Path |
|---------------------|--------------------------|
| Platform core | `lib/gameengin/` (exists, extend) |
| Cartridge runtime | `lib/gameengin/GameRuntime.tsx`, `cartridge.ts` |
| Cartridge manifest/loaders | `lib/gameengin/cartridges/` (exists) |
| Brain | `lib/gameengin/brain/` (new) |
| UI Components | `components/gameengin/` (exists) |
| Routes | `app/gameengin/` (exists) |
| Workflows | `.github/workflows/gameengin-*.yml` (new) |
| Scripts | `scripts/gameengin/` (new) |
| Tests | `tests/gameengin-*.test.ts` (some exist) |
| Cartridge assets | `public/cartridges/` (new) |
| WASM source | `assembly/` (exists, add cartridge files) |

### 7.2 Database Migrations (Additive Only)

**File:** `supabase/migrations/20260418000000_gameengin_core.sql` (full content in Appendix C)

Adds:
- `cartridge_design_rules`
- `gameengin_telemetry` (hypertable)
- `gameengin_snapshots`
- Extends `ai_audit_log` and `game_assets`

### 7.3 Workflow File Additions & Modifications

- **New files:** `gameengin-maestro.yml`, `gameengin-prophet.yml`, `gameengin-artisan.yml`, `gameengin-mechanic.yml`, `gameengin-writer.yml`.
- **Modified:** `dreamengin-preflight.yml` (add `validate-gameengin` job).

### 7.4 UI Navigation & Cartridge Browser

- **Route:** `/gameengin/cartridges` → `app/gameengin/cartridges/page.tsx` (exists)
- **Nav Item:** Already present in `components/engines/games/dream.GameEnginApp.tsx` (💾 Cartridges)
- **HomeDream Widget:** Add to `components/home/dream.HomeSystem.tsx`:

```tsx
import { CartridgeBrowser } from '@/components/gameengin/dream.cartridge.CartridgeBrowser';

// Inside component return
<section>
  <h2>🎮 Featured Cartridges</h2>
  <CartridgeBrowser featured={['mad-maxi']} limit={3} />
</section>
```

### 7.5 Existing Game Cartridge Wrapping

The consolidation slice already wrapped all 28 existing games in `components/games/` as cartridges via `wrapAsCartridge()`. They appear in the cartridge browser and can be launched from `/gameengin/cartridges/[id]`.

---

## 8. IMPLEMENTATION ROADMAP & 36-HOUR SPRINT PLAN

| Hour | Task | Deliverable |
|------|------|-------------|
| 0-2 | Create `lib/gameengin/brain/` directory and seed with initial principles, genre DNA, mechanic library. | Brain seed files |
| 2-4 | Create migration `20260418000000_gameengin_core.sql` and apply to dev DB. | New tables |
| 4-6 | Write workflow YAML files (5 new) in `.github/workflows/`. | Workflows |
| 6-10 | Write core scripts: `maestro-analyze.ts`, `prophet-run.ts`, `mechanic-run.ts`, `artisan-run.ts`, `writer-run.ts`. | Scripts |
| 10-12 | Create `public/cartridges/mad-maxi/` with MANIFEST.json and placeholder assets. | Mad Maxi skeleton |
| 12-16 | Write `assembly/mad-maxi-player.ts` and compile to WASM. | Player controller |
| 16-20 | Integrate CartridgeBrowser widget into HomeDream. | UI integration |
| 20-24 | Run tests: `pnpm vitest run tests/gameengin-*.test.ts`. Fix failures. | Passing tests |
| 24-30 | Manually trigger `gameengin-maestro.yml` with `target_cartridge=mad-maxi`. Review PRs. | First autonomous cycle |
| 30-36 | Deploy to Vercel preview. Test on iPhone 15 Pro Safari. | Live preview |

---

## 9. APPENDIX: COMPLETE FILE LISTINGS

Due to length constraints, full file contents are provided in the previous detailed responses. Key files:

### A. Workflow YAML Files
- `.github/workflows/gameengin-maestro.yml`
- `.github/workflows/gameengin-prophet.yml`
- `.github/workflows/gameengin-artisan.yml`
- `.github/workflows/gameengin-mechanic.yml`
- `.github/workflows/gameengin-writer.yml`

### B. Script Files
- `scripts/gameengin/maestro-analyze.ts`
- `scripts/gameengin/prophet-run.ts`
- `scripts/gameengin/mechanic-run.ts`
- `scripts/gameengin/artisan-run.ts`
- `scripts/gameengin/writer-run.ts`
- `scripts/gameengin/package-cartridge.ts`
- `scripts/gameengin/check-wasm-sizes.ts`

### C. Database Migration SQL
- `supabase/migrations/20260418000000_gameengin_core.sql` (provided in prior response)

### D. Cartridge Manifest Example
- `public/cartridges/mad-maxi/MANIFEST.json` (provided in §1.3)

### E. Brain File Examples
- `lib/gameengin/brain/principles/responsiveness.md` (§2.2)
- `lib/gameengin/brain/genre-dna/platformer.json` (§2.2)
- `lib/gameengin/brain/mechanic-library/movement/double-jump.json` (§2.2)
- `lib/gameengin/brain/inspiration-corpus/celeste.json` (§2.2)

---

**END OF SPECIFICATION**

This document is the definitive, exhaustive technical specification for the GameEngin Platform. It defines every component necessary to build an autonomous, console-class game studio within the existing DREAMengin repository. No further clarification should be required. Implementation proceeds according to the sprint plan.<end of ai context> 
