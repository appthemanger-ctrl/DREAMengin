# Progression State

Per-cartridge ledger that captures **structure-aware** progression — the
modern alternative to "what level are you on?". One JSON file per
cartridge, keyed by `<cartridge_id>.json`. Written by Mechanic / Maestro
through `recordProgressionState` in `brain-reader.ts`; read by Maestro
when planning the next dispatch.

Schema (every gameplay field optional — present only when the structure
type uses it):

- `cartridge_id` — slug, required
- `structure_type` — one of the StructureType union, required
- `world_map_completion_pct` — 0..1 (open-world / metroidvania)
- `ability_unlocks` — string ids (metroidvania / open-world / action-rpg)
- `sequence_breaks` — string ids (metroidvania)
- `run_count` — non-negative integer (run-based)
- `meta_currency` — `{ [name]: number }` (run-based / live-service)
- `season_phase` — string id (live-service)
- `active_events` — string ids (live-service)
- `last_updated_at` — ISO timestamp (auto-set on write)
