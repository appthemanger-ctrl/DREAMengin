# Asset Registry

Append-only ledger of every asset produced by Artisan.

Filename pattern: `YYYY-MM-DD-<cartridge>-<asset>-<ISO-stamp>.json`.

Each entry records:
- `cartridge_id`
- `asset` (cover_art / character_sprite / environment_tileset / …)
- `prompt_manifest_hash` (sha256-prefix of the deterministic prompt + seed + techniques)
- `techniques_applied` (ids referenced from `technique-library/`, `material-recipes/`, `composition-principles/`)
- `submitted_to` (`replicate` / `local` / `none`)
- `output_url` (when remote submission succeeded)

Used by Artisan to avoid re-generating identical assets and by Upgrader to identify cartridges whose visuals are dated.
