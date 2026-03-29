#!/usr/bin/env python3

import argparse
import json
import sys


GAME_PATH_PREFIXES = (
    "components/games/",
    "lib/games/",
    "app/daydream/game",
    "app/daydream/games",
)


def fail(message: str) -> None:
    print(f"Invalid report-agent spec: {message}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate report-agent spec contains an advanced game upgrade")
    parser.add_argument("--spec", required=True, help="Path to report-agent-spec.json")
    parser.add_argument("--targets", required=True, help="Path to advanced-game-targets.json")
    args = parser.parse_args()

    try:
        spec = json.load(open(args.spec, "r", encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"cannot read spec JSON: {exc}")

    try:
        targets_json = json.load(open(args.targets, "r", encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"cannot read targets JSON: {exc}")

    target_ids = {
        item.get("id")
        for item in targets_json.get("advancedTargets", [])
        if item.get("id")
    }
    if not target_ids:
        fail("advanced target manifest is empty")

    upgrade = spec.get("advanced_game_upgrade")
    if not isinstance(upgrade, dict):
        fail("missing advanced_game_upgrade object")

    target_game_id = upgrade.get("target_game_id")
    if target_game_id not in target_ids:
        fail("advanced_game_upgrade.target_game_id is missing or unknown")

    v1_scope = spec.get("v1_scope")
    if not isinstance(v1_scope, dict):
        fail("missing v1_scope object")

    files_to_modify = v1_scope.get("files_to_modify") or []
    files_to_create = v1_scope.get("files_to_create") or []
    touched_files = [*files_to_modify, *files_to_create]
    if not any(isinstance(path, str) and path.startswith(GAME_PATH_PREFIXES) for path in touched_files):
        fail("v1_scope must touch at least one GameEngin/game file")

    print("Report-agent spec includes an advanced game upgrade.", file=sys.stderr)


if __name__ == "__main__":
    main()
