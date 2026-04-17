#!/bin/bash
# Run from root: ./scripts/migrate-imports.sh --dry-run

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
fi

# Replacements (order matters – longest first)
replacements=(
    "s|@/lib/gameengin/core|@/core/ecs/EliteGameEngine|g"
    "s|@/lib/gameengin/power-systems|@/core/ecs/power-systems|g"
    "s|@/lib/gameengin/ai-director|@/core/ai/director|g"
    "s|@/lib/webgpu|@/core/rendering/webgpu|g"
    "s|@/lib/babylon|@/core/rendering/babylon|g"
    "s|@/lib/scene|@/core/spatial/scene|g"
    "s|@/lib/runtime|@/system/runtime|g"
    "s|@/lib/dreamenginOS|@/system/os|g"
    "s|@/lib/supabase|@/system/persistence/supabase|g"
    "s|@/lib/workflowEngine|@/system/workflow/workflowEngine|g"
    "s|@/lib/ai/eams|@/agents/eams|g"
    "s|@/lib/ai/idari|@/agents/idari|g"
    "s|@/lib/ai/boogieman|@/agents/boogieman|g"
    "s|@/lib/agentOS|@/agents/agent-os|g"
    "s|@/lib/ai/rateLimit|@/agents/rate-limit|g"
)

SEARCH_DIRS=()
for dir in app components lib engins games; do
    [[ -d "$dir" ]] && SEARCH_DIRS+=("$dir")
done

if [[ ${#SEARCH_DIRS[@]} -eq 0 ]]; then
    echo "No target directories found; nothing to rewrite."
    exit 0
fi

files=$(find "${SEARCH_DIRS[@]}" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \))

for file in $files; do
    for replacement in "${replacements[@]}"; do
        pattern="${replacement#s|}"
        pattern="${pattern%%|*}"
        if grep -qF "$pattern" "$file"; then
            if [[ "$DRY_RUN" == true ]]; then
                echo "[DRY RUN] sed -i \"$replacement\" \"$file\""
            else
                sed -i "$replacement" "$file"
            fi
        fi
    done
done

if [[ "$DRY_RUN" == true ]]; then
    echo "Dry run complete. Remove --dry-run to apply changes."
else
    echo "Imports updated. Now move directories manually."
fi
