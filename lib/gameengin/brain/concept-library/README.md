# Concept Library

Game Vision Statements produced by the **Game Architect** agent.
See `recordVisionStatement` in `brain-reader.ts` for the schema.

Vision statements are append-only. Maestro consumes them via
`listVisionStatements()` and promotes one into the active-projects
ledger when starting a new cartridge.
