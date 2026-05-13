#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

WORKFLOWS_DIR = Path(".github/workflows")


def leading_spaces(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def is_step_level_entry(lines: list[str], index: int, indent: int) -> bool:
    for cursor in range(index - 1, -1, -1):
        raw = lines[cursor]
        stripped = raw.strip()
        if not stripped or stripped.startswith("#"):
            continue

        current_indent = leading_spaces(raw)
        if current_indent >= indent:
            continue

        if stripped.startswith("steps:"):
            step_item_indent = current_indent + 2
            for probe in range(cursor + 1, index):
                probe_raw = lines[probe]
                probe_stripped = probe_raw.strip()
                if not probe_stripped or probe_stripped.startswith("#"):
                    continue

                probe_indent = leading_spaces(probe_raw)
                if probe_indent <= current_indent:
                    break
                if probe_indent == step_item_indent and probe_stripped.startswith("- "):
                    return True
            return False
    return False


def find_job_level_continue_on_error(path: Path) -> list[str]:
    violations: list[str] = []
    lines = path.read_text(encoding="utf-8").splitlines()

    for index, raw in enumerate(lines):
        stripped = raw.strip()
        if stripped != "continue-on-error: true":
            continue

        indent = leading_spaces(raw)
        if is_step_level_entry(lines, index, indent):
            continue

        violations.append(f"{path}:{index + 1}: job-level continue-on-error true")

    return violations


def main() -> int:
    workflow_files = sorted(WORKFLOWS_DIR.glob("*.yml")) + sorted(WORKFLOWS_DIR.glob("*.yaml"))
    violations: list[str] = []
    for workflow in workflow_files:
        violations.extend(find_job_level_continue_on_error(workflow))

    if violations:
        print("Found forbidden job-level `continue-on-error: true` entries:")
        for violation in violations:
            print(f" - {violation}")
        return 1

    print("No forbidden job-level `continue-on-error: true` entries found.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
