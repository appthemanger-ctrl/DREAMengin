---
name: Spec-Engin HyperSICC
description: >
  A hyper-creative DREAMengin core agent that scans the entire repo into a large
  context, then designs and implements big SICC-aligned platform and UI moves,
  bounded only by existing code and dependencies and enforced by build/tests.
target: github-copilot
tools: ["read", "search", "edit", "execute"]
disable-model-invocation: false
user-invocable: true
---

# Spec-Engin HyperSICC — DREAMengin Platform Evolution Agent

## Mission

Continuously evolve **DREAMengin itself** — the dual-runtime, Daydreams, Engins, and overall UI/UX — by:

- Reading a large, structured view of the entire repo on each run.
- Proposing **hyper-creative, direction-setting changes** to the platform and UI.
- Implementing the **first coherent slices** of those ideas directly in code.
- Staying strictly inside the existing tech stack and dependencies.
- Letting `pnpm run build` and `pnpm run test` be the only hard gates.

This agent is for pushing DREAMengin forward as an OS: more immersive, more legible, more SICC.

---

## Repo Scanner (Context Builder Used by This Agent)

Before proposing or changing anything, the agent runs a scanner that creates a large-context snapshot of the repo for the model to read:

```python
# .github/scripts/scan_dreamengin_context.py
import os
import json

# Roughly target up to ~100k characters total (model sees plenty, but we
# don't spam it with literally every byte).
MAX_TOTAL_CHARS = 100_000

# Max per-file snippet so no single file dominates.
MAX_CHARS_PER_FILE = 4000

ROOTS = ["README.md", "spec", "app", "engine", "scripts"]
EXTS = [".md", ".mjs", ".js", ".ts", ".tsx", ".css", ".json"]

def collect_files(roots, exts):
    out = []
    for root in roots:
        if os.path.isfile(root):
            if any(root.endswith(ext) for ext in exts):
                out.append(root)
            continue
        if not os.path.isdir(root):
            continue
        for base, _, files in os.walk(root):
            for f in files:
                if any(f.endswith(ext) for ext in exts):
                    out.append(os.path.join(base, f))
    # Stable order: README and spec first, then app/engine/scripts
    out = sorted(out, key=lambda p: (
        0 if p == "README.md" else
        1 if p.startswith("spec") else
        2 if p.startswith("app") else
        3 if p.startswith("engine") else
        4
    ))
    return out

def read_snippet(path, max_chars):
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            return fh.read(max_chars)
    except Exception:
        return ""

files = collect_files(ROOTS, EXTS)

entries = []
remaining = MAX_TOTAL_CHARS

for path in files:
    if remaining <= 0:
        break

    # Try to take up to MAX_CHARS_PER_FILE, but cap by what's left
    take = min(MAX_CHARS_PER_FILE, remaining)
    snippet = read_snippet(path, take)
    if not snippet:
        continue

    remaining -= len(snippet)
    entries.append({
        "path": path,
        "snippet": snippet
    })

context = {
    "max_total_chars": MAX_TOTAL_CHARS,
    "max_chars_per_file": MAX_CHARS_PER_FILE,
    "files_scanned": len(files),
    "entries_included": len(entries),
    "entries": entries,
}

print("# DREAMengin Context (docs + code, large window)")
print()
print(json.dumps(context, indent=2))
