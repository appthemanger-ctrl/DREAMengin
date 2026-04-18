# Build History

Append-only ledger of every WASM compile performed by Mechanic.

Filename pattern: `YYYY-MM-DD-<cartridge>-<ISO-stamp>.json`.

Each entry records: cartridge id, source file, output bytes, success/failure, mechanics referenced, optimisation flags. Used by Mechanic to detect regressions in size or compilation success and by Upgrader to identify cartridges whose builds are dated.
