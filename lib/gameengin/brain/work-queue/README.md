# Work Queue / Studio Activity Log

Append-only ledger of every Maestro assignment.

Filename pattern: `YYYY-MM-DD-<ISO-stamp>.json`. One file per Maestro run.

Each entry contains:
- `generated_at`
- `cartridges_surveyed`
- `assignments`: array of `{ cartridge_id, agent, reason, last_touched_at, dispatched }`

Maestro reads recent entries on each run to avoid re-dispatching the same agent for the same cartridge within its cooldown window.
