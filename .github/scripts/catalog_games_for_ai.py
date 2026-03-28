# Save as: .github/scripts/catalog_games_for_ai.py
import os
import json

GAMES_ROOT = "games"

games = []

if os.path.isdir(GAMES_ROOT):
    for name in sorted(os.listdir(GAMES_ROOT)):
        path = os.path.join(GAMES_ROOT, name)
        if os.path.isdir(path):
            files = []
            for base, _, fs in os.walk(path):
                for f in fs:
                    if f.endswith((".ts", ".tsx")):
                        files.append(os.path.join(base, f))
            games.append({
                "slug": name,
                "file_count": len(files),
                "has_babylon_scene": any("babylon" in f.lower() for f in files),
            })

print("# Games Library Context")
print()
print(json.dumps({"games": games}, indent=2))
