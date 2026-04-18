# Principle: Feedback

## Definition
Every meaningful player action must produce an unmistakable sensory response —
visual, audible, and (when available) haptic — within the same frame as the
action that triggered it.

## Quantifiable Targets
| Channel | Target | Notes |
|---------|--------|-------|
| Visual reaction latency | ≤ 1 frame | Particles, hit-stop, screen shake |
| Audio cue latency | ≤ 30 ms | Use Web Audio API, pre-decoded buffers |
| Haptic latency | ≤ 50 ms | `navigator.vibrate` or Gamepad `vibrationActuator` |
| Hit-stop duration | 50–120 ms | Scales with damage / impulse magnitude |
| Screen shake decay | ~150 ms | Exponential decay, capped amplitude |

## Implementation
- Pool particle bursts via `lib/gameengin/power-systems.ts` ResourcePool.
- Trigger SFX directly from the same WASM tick as the gameplay event.
- Define haptic patterns inside `mechanic-library/**/*.json` — one source of truth.

## Anti-Patterns
- Silent collisions or invisible damage.
- Muffled feedback for high-impact actions.
- Haptic-only feedback (excludes desktop / accessibility users).
