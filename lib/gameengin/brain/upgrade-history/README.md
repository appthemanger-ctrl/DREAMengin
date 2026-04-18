# Upgrade History

Append-only ledger of every upgrade decision made by Upgrader, organised per cartridge.

Filename pattern: `<cartridge_id>/<YYYY-MM-DD>-<ISO-stamp>.json`.

Each entry records:
- `cartridge_id`
- `upgrade_targets`: which dimensions were judged to need refresh (`mechanics`, `visuals`, `narrative`, `tuning`)
- `priority_scores`: numeric scores per dimension
- `dispatched_agents`: which agents Upgrader invoked (or would have invoked in dry mode)
- `backward_compatibility_checks`: list of save-schema and level-format checks performed

Used by Upgrader itself to track which improvements have already been applied, and by Maestro to weigh upgrade-pressure against new-cartridge work.
