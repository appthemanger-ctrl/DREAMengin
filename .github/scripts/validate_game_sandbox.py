# Save as: .github/scripts/validate_game_sandbox.py
import os
import sys

ALLOWED_ENTRY_POINTS = [
    "engine/gameengin",
    "engine/gameengin/",
]


def is_allowed_import(line: str) -> bool:
    line = line.strip()
    if not (line.startswith("import") or line.startswith("export")):
        return True
    if "from " not in line:
        return True
    src = line.split("from", 1)[1].strip().strip("'\"")
    # allow relative imports within games/**
    if src.startswith("."):
        return True
    # only allow importing GameEngin or submodules of it
    return any(src.startswith(prefix) for prefix in ALLOWED_ENTRY_POINTS)


errors = []

for base, _, files in os.walk("games"):
    for f in files:
        if not f.endswith((".ts", ".tsx")):
            continue
        path = os.path.join(base, f)
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            for i, line in enumerate(fh, start=1):
                if not is_allowed_import(line):
                    errors.append(f"{path}:{i}: illegal import: {line.strip()}")

if errors:
    print("Game sandbox validation failed:\n")
    for e in errors:
        print(e)
    sys.exit(1)

print("Game sandbox validation passed.")
