import json
from pathlib import Path

ROOT = Path(".")
TARGETS_PATH = ROOT / "config" / "advanced-game-targets.json"
GAME_ROOTS = [ROOT / "components" / "games", ROOT / "games"]
SKIP_FILES = {"GameRemote.tsx", "GamesHub.tsx"}


def count_lines(path: Path) -> int:
    try:
        return len(path.read_text(encoding="utf-8", errors="ignore").splitlines())
    except OSError:
        return 0


advanced_targets = {}
if TARGETS_PATH.exists():
    try:
        data = json.loads(TARGETS_PATH.read_text(encoding="utf-8"))
        advanced_targets = {
            item.get("componentPath", ""): item
            for item in data.get("advancedTargets", [])
            if item.get("componentPath")
        }
    except (json.JSONDecodeError, OSError):
        advanced_targets = {}

games = []

for root in GAME_ROOTS:
    if not root.is_dir():
        continue
    for path in sorted(root.rglob("*.tsx")):
        if path.name in SKIP_FILES:
            continue
        rel_path = path.as_posix()
        source = path.read_text(encoding="utf-8", errors="ignore")
        target_meta = advanced_targets.get(rel_path, {})
        games.append({
            "id": path.stem.lower(),
            "label": path.stem,
            "path": rel_path,
            "line_count": count_lines(path),
            "has_babylon_scene": "babylon" in source.lower(),
            "has_canvas_scene": "canvas" in source.lower(),
            "advanced_target": bool(target_meta),
            "advanced_target_id": target_meta.get("id"),
            "advanced_tier": target_meta.get("tier"),
        })

print("# Games Library Context")
print()
print(json.dumps({"games": games}, indent=2))
