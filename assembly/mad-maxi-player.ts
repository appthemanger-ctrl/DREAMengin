/**
 * assembly/mad-maxi-player.ts
 *
 * Mad Maxi cartridge player controller.
 * Spec: GameENGINspec.md §1.6, §5.3.
 *
 * Compiles to public/cartridges/mad-maxi/logic/main.wasm via:
 *   pnpm asbuild:mad-maxi
 *
 * Implements every required cartridge export from the spec:
 *   init, update, handleInput, getSnapshotSize, writeSnapshot, loadSnapshot,
 *   getMemoryUsage  (+ memory).
 *
 * Features (all tuning from public/cartridges/mad-maxi/tuning.json):
 *   - Coyote time (6 frames)
 *   - Input buffering (8 frames)
 *   - Variable-height jump (release-to-fall-faster)
 *   - Double jump
 *   - Eight-directional dash with iframes
 *   - Snapshot save/load (deterministic binary layout)
 */

// --- Tuning (mirrors tuning.json) --------------------------------------------
const FIXED_HZ:        f32 = 60.0;
const GRAVITY:         f32 = 15.0;
const MAX_HSPEED:      f32 = 7.5;
const GROUND_ACCEL:    f32 = 60.0;
const GROUND_FRICTION: f32 = 18.0;
const AIR_ACCEL:       f32 = 28.0;
const JUMP_FORCE:      f32 = 8.0;
const DJUMP_FORCE:     f32 = 7.0;
const VAR_JUMP_MULT:   f32 = 2.4;
const COYOTE_FRAMES:   i32 = 6;
const BUFFER_FRAMES:   i32 = 8;
const DASH_MULT:       f32 = 3.5;
const DASH_FRAMES:     i32 = 11;
const DASH_COOLDOWN:   i32 = 15;
const DASH_IFRAMES:    i32 = 7;

// --- State (single instance, in linear memory) -------------------------------
class PlayerState {
  // kinematics
  x:  f32 = 0.0; y:  f32 = 0.0;
  vx: f32 = 0.0; vy: f32 = 0.0;
  // contact
  onGround: bool = false;
  // jump bookkeeping
  jumpsUsed:    i32 = 0;
  coyoteTimer:  i32 = 0;
  jumpBuffer:   i32 = 0;
  jumpHeld:     bool = false;
  // dash bookkeeping
  dashTimer:    i32 = 0;
  dashCooldown: i32 = 0;
  iframes:      i32 = 0;
  facingX:      f32 = 1.0;
  // diagnostics
  ticks: u32 = 0;
}

const state = new PlayerState();

// --- Input layout (matches host InputState) ----------------------------------
// Host writes at inputPtr 8 contiguous bytes:
//   [0]=left [1]=right [2]=jump [3]=dash [4]=attack [5]=pause [6]=down [7]=up
class InputSnapshot {
  left: bool = false; right: bool = false;
  jump: bool = false; dash:  bool = false;
  attack: bool = false; pause: bool = false;
  down: bool = false; up: bool = false;
}
const input = new InputSnapshot();
let prevJump: bool = false;
let prevDash: bool = false;

// --- Spec-required exports ---------------------------------------------------

export function init(_platformPtr: usize): void {
  state.x = 0.0; state.y = 0.0;
  state.vx = 0.0; state.vy = 0.0;
  state.onGround = true;
  state.jumpsUsed = 0;
  state.coyoteTimer = 0;
  state.jumpBuffer = 0;
  state.dashTimer = 0;
  state.dashCooldown = 0;
  state.iframes = 0;
  state.facingX = 1.0;
  state.ticks = 0;
}

export function handleInput(inputPtr: usize): void {
  prevJump = input.jump;
  prevDash = input.dash;
  input.left   = load<u8>(inputPtr + 0) != 0;
  input.right  = load<u8>(inputPtr + 1) != 0;
  input.jump   = load<u8>(inputPtr + 2) != 0;
  input.dash   = load<u8>(inputPtr + 3) != 0;
  input.attack = load<u8>(inputPtr + 4) != 0;
  input.pause  = load<u8>(inputPtr + 5) != 0;
  input.down   = load<u8>(inputPtr + 6) != 0;
  input.up     = load<u8>(inputPtr + 7) != 0;
  // Edge-trigger jump-press fills buffer
  if (input.jump && !prevJump) state.jumpBuffer = BUFFER_FRAMES;
  state.jumpHeld = input.jump;
}

export function update(deltaMs: f32): void {
  // Fixed-step: convert ms to seconds at the assumed cadence.
  const dt: f32 = deltaMs / 1000.0;
  state.ticks += 1;

  // Decrement timers
  if (state.coyoteTimer  > 0) state.coyoteTimer  -= 1;
  if (state.jumpBuffer   > 0) state.jumpBuffer   -= 1;
  if (state.dashTimer    > 0) state.dashTimer    -= 1;
  if (state.dashCooldown > 0) state.dashCooldown -= 1;
  if (state.iframes      > 0) state.iframes      -= 1;

  // Horizontal intent
  let intent: f32 = 0.0;
  if (input.left)  intent -= 1.0;
  if (input.right) intent += 1.0;
  if (intent != 0.0) state.facingX = intent;

  // Dash trigger (edge of dash button, off-cooldown)
  if (input.dash && !prevDash && state.dashCooldown == 0) {
    let dx: f32 = intent != 0.0 ? intent : state.facingX;
    let dy: f32 = 0.0;
    if (input.up)   dy = 1.0;
    if (input.down) dy = -1.0;
    // Normalize diagonal
    const mag: f32 = <f32>Math.sqrt(<f64>(dx * dx + dy * dy));
    if (mag > 0.0) { dx /= mag; dy /= mag; }
    state.vx = dx * MAX_HSPEED * DASH_MULT;
    state.vy = dy * MAX_HSPEED * DASH_MULT;
    state.dashTimer    = DASH_FRAMES;
    state.dashCooldown = DASH_FRAMES + DASH_COOLDOWN;
    state.iframes      = DASH_IFRAMES;
  }

  // Jump consume from buffer (with coyote-time grace)
  const canGroundJump: bool = state.onGround || state.coyoteTimer > 0;
  if (state.jumpBuffer > 0) {
    if (canGroundJump) {
      state.vy = JUMP_FORCE;
      state.jumpsUsed = 1;
      state.jumpBuffer = 0;
      state.coyoteTimer = 0;
      state.onGround = false;
    } else if (state.jumpsUsed < 2) {
      state.vy = DJUMP_FORCE;
      state.jumpsUsed = 2;
      state.jumpBuffer = 0;
    }
  }

  // Movement integration (skip during dash freeze)
  if (state.dashTimer == 0) {
    const accel: f32 = state.onGround ? GROUND_ACCEL : AIR_ACCEL;
    state.vx += intent * accel * dt;
    if (intent == 0.0 && state.onGround) {
      // Apply ground friction
      const sign: f32 = state.vx > 0.0 ? 1.0 : (state.vx < 0.0 ? -1.0 : 0.0);
      const decel: f32 = GROUND_FRICTION * dt;
      if (<f32>Math.abs(<f64>state.vx) <= decel) state.vx = 0.0;
      else state.vx -= sign * decel;
    }
    if (state.vx >  MAX_HSPEED) state.vx =  MAX_HSPEED;
    if (state.vx < -MAX_HSPEED) state.vx = -MAX_HSPEED;

    // Variable-height: when ascending and the player has released jump,
    // gravity is multiplied to make the fall begin sooner.
    let g: f32 = GRAVITY;
    if (state.vy > 0.0 && !state.jumpHeld) g *= VAR_JUMP_MULT;
    state.vy -= g * dt;
  }

  state.x += state.vx * dt;
  state.y += state.vy * dt;

  // Trivial floor at y=0
  if (state.y <= 0.0) {
    state.y = 0.0;
    if (!state.onGround) {
      state.onGround = true;
      state.jumpsUsed = 0;
    }
    if (state.vy < 0.0) state.vy = 0.0;
  } else if (state.onGround) {
    state.onGround = false;
    state.coyoteTimer = COYOTE_FRAMES;
  }
}

// --- Snapshot save / load ----------------------------------------------------
// Deterministic layout (little-endian, packed):
//   f32 x, y, vx, vy
//   u8  onGround
//   i32 jumpsUsed, coyoteTimer, jumpBuffer, dashTimer, dashCooldown, iframes
//   f32 facingX
//   u32 ticks
//   u8  jumpHeld
// Total: 4*5 + 1 + 4*6 + 4 + 4 + 1 = 54 bytes
const SNAPSHOT_SIZE: i32 = 54;

export function getSnapshotSize(): i32 { return SNAPSHOT_SIZE; }

export function writeSnapshot(bufferPtr: usize): void {
  let p: usize = bufferPtr;
  store<f32>(p, state.x);  p += 4;
  store<f32>(p, state.y);  p += 4;
  store<f32>(p, state.vx); p += 4;
  store<f32>(p, state.vy); p += 4;
  store<u8> (p, state.onGround ? <u8>1 : <u8>0); p += 1;
  store<i32>(p, state.jumpsUsed);    p += 4;
  store<i32>(p, state.coyoteTimer);  p += 4;
  store<i32>(p, state.jumpBuffer);   p += 4;
  store<i32>(p, state.dashTimer);    p += 4;
  store<i32>(p, state.dashCooldown); p += 4;
  store<i32>(p, state.iframes);      p += 4;
  store<f32>(p, state.facingX);      p += 4;
  store<u32>(p, state.ticks);        p += 4;
  store<u8> (p, state.jumpHeld ? <u8>1 : <u8>0);
}

export function loadSnapshot(bufferPtr: usize): void {
  let p: usize = bufferPtr;
  state.x  = load<f32>(p); p += 4;
  state.y  = load<f32>(p); p += 4;
  state.vx = load<f32>(p); p += 4;
  state.vy = load<f32>(p); p += 4;
  state.onGround = load<u8>(p) != 0; p += 1;
  state.jumpsUsed    = load<i32>(p); p += 4;
  state.coyoteTimer  = load<i32>(p); p += 4;
  state.jumpBuffer   = load<i32>(p); p += 4;
  state.dashTimer    = load<i32>(p); p += 4;
  state.dashCooldown = load<i32>(p); p += 4;
  state.iframes      = load<i32>(p); p += 4;
  state.facingX      = load<f32>(p); p += 4;
  state.ticks        = load<u32>(p); p += 4;
  state.jumpHeld     = load<u8>(p) != 0;
}

export function getMemoryUsage(): i32 {
  // AssemblyScript: __heap_base is the static-data high-water mark.
  return <i32>__heap_base;
}

// --- Diagnostic exports (used by host telemetry & tests) ---------------------
export function getX(): f32 { return state.x; }
export function getY(): f32 { return state.y; }
export function getVX(): f32 { return state.vx; }
export function getVY(): f32 { return state.vy; }
export function getOnGround(): bool { return state.onGround; }
export function getJumpsUsed(): i32 { return state.jumpsUsed; }
export function getCoyoteTimer(): i32 { return state.coyoteTimer; }
export function getDashTimer(): i32 { return state.dashTimer; }
export function getTicks(): u32 { return state.ticks; }
