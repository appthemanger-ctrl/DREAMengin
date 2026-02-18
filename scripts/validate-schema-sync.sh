#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Install: https://supabase.com/docs/guides/cli"
  exit 2
fi

# Start local stack (skip Studio to save time in CI)
supabase start -x studio,imgproxy,analytics,vector 1>/dev/null

# Rebuild DB from migrations (source of truth)
supabase db reset 1>/dev/null

# Diff current local DB (after reset) against migrations-applied shadow DB.
# This should be empty if migrations are fully deterministic and represent the schema.
DIFF="$(supabase db diff --local --schema public || true)"

# Heuristic: if diff contains any DDL keywords, schema drift exists.
if echo "$DIFF" | grep -Eiq '^(create|alter|drop|grant|revoke)\b'; then
  echo "Schema drift detected. supabase db diff reports changes:"
  echo "$DIFF"
  supabase stop 1>/dev/null || true
  exit 1
fi

echo "Schema sync OK (no drift)."
supabase stop 1>/dev/null || true
