# Principle: Responsiveness

## Definition
The game must feel like a direct extension of the player's intent. Input
latency, frame rate, and control predictability are paramount.

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
