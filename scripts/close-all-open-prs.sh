#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# close-all-open-prs.sh
# Closes every open pull request in the repo without merging.
# Requires: gh CLI (https://cli.github.com) authenticated.
# Usage:    bash scripts/close-all-open-prs.sh
# ─────────────────────────────────────────────────────────
set -euo pipefail

REPO="appthemanger-ctrl/DREAMengin"

echo "Fetching open PRs for $REPO ..."
PR_NUMBERS=$(gh pr list --repo "$REPO" --state open --json number --jq '.[].number')

if [ -z "$PR_NUMBERS" ]; then
  echo "No open PRs found. Nothing to do."
  exit 0
fi

COUNT=$(echo "$PR_NUMBERS" | wc -l | tr -d ' ')
echo "Found $COUNT open PR(s). Closing all without merging ..."

for PR in $PR_NUMBERS; do
  echo "  Closing PR #$PR ..."
  gh pr close "$PR" --repo "$REPO" || echo "  ⚠ Failed to close PR #$PR"
done

echo "Done. All open PRs have been closed."
