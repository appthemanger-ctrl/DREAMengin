# GameEngin Brain — File-Based Knowledge Substrate

Authoritative source: [`GameENGINspec.md`](../../../GameENGINspec.md) §2.

The Brain is a version-controlled directory that is the **single source of truth**
for game-design knowledge, inspiration, and originality tracking used by the
autonomous studio agents (Maestro, Prophet, Artisan, Mechanic, Writer, Tech
Director).

## Layout

| Path | Purpose |
|------|---------|
| `principles/`            | Timeless axioms of game feel (markdown) |
| `genre-dna/`             | What defines each genre (JSON) |
| `mechanic-library/`      | Catalog of proven mechanics, by category (JSON) |
| `inspiration-corpus/`    | Deep analysis of great games 2006–2026 (JSON) |
| `fun-heuristics/`        | Quantifiable "fun" signals (JSON) |
| `review-corpus/`         | Cached scraped review data (JSON) |
| `originality-registry/`  | Mechanic-combo signature hashes preventing accidental clones |
| `rd-sessions/`           | Append-only logs of every AI research session |
| `predictions/`           | Pending and validated AI fun-score predictions |
| `visual-bible/`          | Art-style references for Artisan |

## Read / Write API

All agents interact with the brain through `lib/gameengin/brain-reader.ts`
(see §2.3 of the spec).
