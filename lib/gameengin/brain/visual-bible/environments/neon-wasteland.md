# Visual Bible: Neon Wasteland

## Mood
Sun-bleached desert ruins reclaimed by chrome-and-magenta neon graffiti.
Dawn / dusk light only — never noon, never midnight.

## Palette
| Role | Hex |
|------|-----|
| Sky base | `#1a0d2e` |
| Sky accent | `#ff2bd6` |
| Sand | `#c8981a` |
| Rust | `#7a2e1a` |
| Neon primary | `#0ff` |
| Neon secondary | `#f0f` |

## Materials
- PBR with `metallic: 0.6, roughness: 0.45` for chrome surfaces.
- Emissive intensity 2.5 for neon strips (HDR bloom in PostFX).
- Anisotropic dust on every horizontal surface (wind direction +X).

## Forbidden
- Pure greens (saturated foliage breaks the wasteland fiction).
- Volumetric god-rays at noon angles.
- Photoreal human skin.
