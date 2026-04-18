# Crash Reports — Project History (Brain feedback loop)

Append-only ledger of player-submitted crash & critical-bug reports for each
cartridge. When a cartridge crashes, a report window opens; the statement the
player writes is POSTed to `/api/gameengin/crash-report` and stored here as
part of that cartridge's **Project History** so Maestro can read it on the
next dispatch cycle and route fixes to the right specialist agent.

## Filename pattern

`<cartridge_id>/YYYY-MM-DD-<ISO-stamp>.json`

## Rules

- Reports are **only** accepted for cartridges currently listed in
  `active-projects.json`. Unknown / inactive cartridges are rejected by the
  API so the back-catalog stays Upgrader's domain.
- The endpoint never trusts client input for `received_at`.
- Maximum payload size enforced server-side (16 KB).
