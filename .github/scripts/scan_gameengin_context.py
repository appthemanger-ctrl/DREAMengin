# Save as: .github/scripts/scan_gameengin_context.py
import os
import json


def list_ts_files(root: str):
    paths = []
    for base, _, files in os.walk(root):
        for f in files:
            if f.endswith((".ts", ".tsx")):
                rel = os.path.join(base, f)
                paths.append(rel)
    return paths


context = {
    "engine_files": list_ts_files("engine") if os.path.isdir("engine") else [],
    "game_files": list_ts_files("games") if os.path.isdir("games") else [],
    "routes": [],
}

if os.path.isdir("app"):
    for base, _, files in os.walk("app"):
        for f in files:
            if f in ("page.tsx", "route.ts", "layout.tsx"):
                rel = os.path.join(base, f)
                context["routes"].append(rel)

print("# GameEngin Context")
print()
print(json.dumps(context, indent=2))
