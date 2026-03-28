# .github/scripts/scan_dreamengin_context.py
#
# Scans DREAMengin docs + code and writes a large-context JSON snapshot
# that the Spec-Engin AI agent reads as its "world model".
#
# Usage:
#   python .github/scripts/scan_dreamengin_context.py \
#       > .github/generated/dreamengin-context.md
#
# Output format: Markdown wrapper + JSON body so the file is both
# human-readable in GitHub and machine-parseable by downstream scripts.

import os
import json

# Roughly target up to ~100k characters total (model sees plenty, but we
# don't spam it with literally every byte).
MAX_TOTAL_CHARS = 100_000

# Max per-file snippet so no single file dominates.
MAX_CHARS_PER_FILE = 4_000

ROOTS = ["README.md", "docs", "spec", "app", "components", "lib", "styles"]
EXTS  = [".md", ".mjs", ".js", ".ts", ".tsx", ".css", ".json"]

# Files and directories to skip (build artefacts, lock files, generated output).
SKIP_DIRS  = {".next", "node_modules", ".git", ".github/generated"}
SKIP_FILES = {"pnpm-lock.yaml", "package-lock.json", "yarn.lock"}


def collect_files(roots, exts):
    out = []
    for root in roots:
        if os.path.isfile(root):
            if any(root.endswith(ext) for ext in exts):
                out.append(root)
            continue
        if not os.path.isdir(root):
            continue
        for base, dirs, files in os.walk(root):
            # Prune skip directories in-place so os.walk won't descend into them.
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS
                       and not any(os.path.join(base, d).startswith(s)
                                   for s in SKIP_DIRS)]
            for f in files:
                if f in SKIP_FILES:
                    continue
                if any(f.endswith(ext) for ext in exts):
                    out.append(os.path.join(base, f))

    # Stable priority order: README → docs/spec → app → components → lib → styles → rest
    def sort_key(p):
        if p == "README.md":
            return 0
        if p.startswith("docs") or p.startswith("spec"):
            return 1
        if p.startswith("app"):
            return 2
        if p.startswith("components"):
            return 3
        if p.startswith("lib"):
            return 4
        if p.startswith("styles"):
            return 5
        return 6

    return sorted(out, key=sort_key)


def read_snippet(path, max_chars):
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            return fh.read(max_chars)
    except Exception:
        return ""


files     = collect_files(ROOTS, EXTS)
entries   = []
remaining = MAX_TOTAL_CHARS

for path in files:
    if remaining <= 0:
        break

    # Take up to MAX_CHARS_PER_FILE, but never exceed what's left overall.
    take    = min(MAX_CHARS_PER_FILE, remaining)
    snippet = read_snippet(path, take)
    if not snippet:
        continue

    remaining -= len(snippet)
    entries.append({
        "path":    path,
        "snippet": snippet,
    })

context = {
    "max_total_chars":   MAX_TOTAL_CHARS,
    "max_chars_per_file": MAX_CHARS_PER_FILE,
    "files_scanned":     len(files),
    "entries_included":  len(entries),
    "entries":           entries,
}

print("# DREAMengin Context (docs + code, large window)")
print()
print(json.dumps(context, indent=2))
