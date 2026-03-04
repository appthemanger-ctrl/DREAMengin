#!/usr/bin/env bash
set -euo pipefail

# DREAMengin LAW enforcement check.
# - Blocks edits to protected Day Dream paths unless PR title includes [DAYDREAM_OK]
# - Designed to run in GitHub Actions on pull_request.

PR_TITLE="${1:-}"

PROTECTED_REGEX='^components/dreamnav/nodes/|^components/dreamnav/HomeDreamRuntime\.tsx$'

# Determine changed files in PR context.
# In Actions, fetch-depth may be shallow; we rely on the base/head refs that Actions provides.
if git rev-parse --verify --quiet origin/"$GITHUB_BASE_REF" >/dev/null 2>&1; then
  BASE_REF="origin/$GITHUB_BASE_REF"
else
  # fallback: use merge-base with HEAD~1
  BASE_REF="$(git rev-parse HEAD~1)"
fi

CHANGED="$(git diff --name-only "$BASE_REF"...HEAD || true)"

if [[ -z "$CHANGED" ]]; then
  echo "LAW: No changed files detected."
  exit 0
fi

echo "LAW: Changed files:"
echo "$CHANGED"

VIOLATIONS=0

while IFS= read -r f; do
  if [[ "$f" =~ $PROTECTED_REGEX ]]; then
    if [[ "$PR_TITLE" != *"[DAYDREAM_OK]"* ]]; then
      echo "LAW VIOLATION: protected Day Dream path modified without [DAYDREAM_OK] in PR title: $f"
      VIOLATIONS=1
    fi
  fi
done <<< "$CHANGED"

if [[ "$VIOLATIONS" -ne 0 ]]; then
  echo ""
  echo "To modify Day Dream code, include [DAYDREAM_OK] in the PR title."
  echo "See docs/LAW.md."
  exit 1
fi

echo "LAW: OK"
